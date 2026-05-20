import { Router, Response, type RequestHandler } from "express";
import { Prisma, ConversationRequestStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { authenticate, type AuthRequest } from "../middleware/auth.middleware";

const router = Router();
const authMiddleware = authenticate as unknown as RequestHandler;
const TRIAL_MESSAGE_LIMIT = 3;

// GET /api/messages/contacts — usuarios para iniciar conversación
router.get("/contacts", authMiddleware, async (req, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const q = String(req.query.q ?? "").trim();

    const [relations, myConversations] = await Promise.all([
      prisma.follow.findMany({
        where: {
          OR: [
            { followerId: authReq.user!.id },
            { followingId: authReq.user!.id },
          ],
        },
        select: {
          followerId: true,
          followingId: true,
        },
      }),
      prisma.conversation.findMany({
        where: { participants: { some: { userId: authReq.user!.id } } },
        include: { participants: { select: { userId: true } } },
      }),
    ]);

    const existingConversationByUser = new Map<string, string>();
    const allowedUserIds = new Set<string>();

    for (const relation of relations) {
      if (relation.followerId === authReq.user!.id) {
        // Solo quienes YO sigo
        allowedUserIds.add(relation.followingId);
      }
    }

    for (const conversation of myConversations) {
      const otherParticipant = conversation.participants.find((participant) => participant.userId !== authReq.user!.id);
      if (otherParticipant) {
        allowedUserIds.add(otherParticipant.userId);
        existingConversationByUser.set(otherParticipant.userId, conversation.id);
      }
    }

    const searchingOutsideNetwork = q.length >= 2;

    if (allowedUserIds.size === 0 && !searchingOutsideNetwork) {
      return res.json([]);
    }

    const where: Prisma.UserWhereInput = {
      isActive: true,
      id: searchingOutsideNetwork
        ? { not: authReq.user!.id }
        : { in: Array.from(allowedUserIds) },
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { headline: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        headline: true,
        role: true,
      },
      orderBy: { name: "asc" },
      take: 20,
    });

    res.json(
      users.map((user) => ({
        ...user,
        conversationId: existingConversationByUser.get(user.id) || null,
      }))
    );
  } catch {
    res.status(500).json({ error: "Error al buscar contactos" });
  }
});

// GET /api/messages/conversations — mis conversaciones
router.get("/conversations", authMiddleware, async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const conversations = await prisma.conversation.findMany({
    where: {
      participants: { some: { userId: authReq.user!.id } },
    },
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true, avatarUrl: true, headline: true, role: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const myPendingConversationIds = conversations
    .filter((conversation) => conversation.requestStatus === ConversationRequestStatus.PENDING && conversation.requesterId === authReq.user!.id)
    .map((conversation) => conversation.id);

  const pendingMessageCounts = myPendingConversationIds.length > 0
    ? await prisma.message.groupBy({
        by: ["conversationId"],
        where: {
          conversationId: { in: myPendingConversationIds },
          senderId: authReq.user!.id,
        },
        _count: { _all: true },
      })
    : [];

  const sentCountByConversation = new Map(
    pendingMessageCounts.map((row) => [row.conversationId, row._count._all])
  );

  const formatted = conversations.map(conv => {
    const otherParticipant = conv.participants.find(p => p.userId !== authReq.user!.id);
    const lastMessage = conv.messages[0] || null;

    const remainingTrialMessages = conv.requestStatus === ConversationRequestStatus.PENDING && conv.requesterId === authReq.user!.id
      ? Math.max(0, TRIAL_MESSAGE_LIMIT - (sentCountByConversation.get(conv.id) ?? 0))
      : null;

    return {
      id: conv.id,
      contact: otherParticipant?.user,
      lastMessage,
      updatedAt: conv.updatedAt,
      requestStatus: conv.requestStatus,
      requesterId: conv.requesterId,
      pendingApprovalForMe: conv.requestStatus === ConversationRequestStatus.PENDING && conv.requesterId !== authReq.user!.id,
      remainingTrialMessages,
    };
  });

  res.json(formatted);
});

// GET /api/messages/conversations/:id — mensajes de una conversación
router.get("/conversations/:id", authMiddleware, async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const isParticipant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: req.params.id, userId: authReq.user!.id } },
  });
  if (!isParticipant) return res.status(403).json({ error: "Sin acceso a esta conversación" });

  const messages = await prisma.message.findMany({
    where: { conversationId: req.params.id },
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  await prisma.message.updateMany({
    where: { conversationId: req.params.id, receiverId: authReq.user!.id, isRead: false },
    data: { isRead: true },
  });

  res.json(messages);
});

// PATCH /api/messages/conversations/:id/request — aceptar o rechazar solicitud
router.patch("/conversations/:id/request", authMiddleware, async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const action = String(req.body?.action ?? "").toLowerCase();
  if (action !== "accept" && action !== "reject") {
    return res.status(400).json({ error: "action debe ser 'accept' o 'reject'" });
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: req.params.id },
    include: { participants: { select: { userId: true } } },
  });

  if (!conversation) {
    return res.status(404).json({ error: "Conversación no encontrada" });
  }

  const isParticipant = conversation.participants.some((participant) => participant.userId === authReq.user!.id);
  if (!isParticipant) {
    return res.status(403).json({ error: "Sin acceso a esta conversación" });
  }

  if (conversation.requestStatus !== ConversationRequestStatus.PENDING || !conversation.requesterId) {
    return res.status(400).json({ error: "Esta conversación no está pendiente de aprobación" });
  }

  if (conversation.requesterId === authReq.user!.id) {
    return res.status(403).json({ error: "No puedes responder tu propia solicitud" });
  }

  const nextStatus = action === "accept" ? ConversationRequestStatus.OPEN : ConversationRequestStatus.REJECTED;

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      requestStatus: nextStatus,
      updatedAt: new Date(),
    },
  });

  await prisma.notification.create({
    data: {
      userId: conversation.requesterId,
      type: action === "accept" ? "MESSAGE_REQUEST_ACCEPTED" : "MESSAGE_REQUEST_REJECTED",
      title: action === "accept" ? "Solicitud de conversación aceptada" : "Solicitud de conversación rechazada",
      body: action === "accept"
        ? "Ahora pueden seguir conversando sin límites."
        : "La otra persona decidió no continuar la conversación.",
      metadata: { conversationId: conversation.id, decidedBy: authReq.user!.id },
    },
  });

  res.json({ requestStatus: nextStatus });
});

// POST /api/messages — enviar mensaje (crea conversación si no existe)
router.post("/", authMiddleware, async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const { receiverId, content, conversationId } = req.body;
  const senderId = authReq.user!.id;
  const trimmedContent = String(content ?? "").trim();

  if (!trimmedContent) {
    return res.status(400).json({ error: "content es requerido" });
  }

  let conversation: {
    id: string;
    requestStatus: ConversationRequestStatus;
    requesterId: string | null;
    participants: Array<{ userId: string }>;
  } | null = null;

  if (conversationId) {
    conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        requestStatus: true,
        requesterId: true,
        participants: { select: { userId: true } },
      },
    });
  } else {
    const targetReceiverId = String(receiverId ?? "");

    if (!targetReceiverId) {
      return res.status(400).json({ error: "receiverId es requerido para iniciar conversación" });
    }

    if (targetReceiverId === senderId) {
      return res.status(400).json({ error: "No puedes enviarte mensajes a ti misma" });
    }

    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: senderId } } },
          { participants: { some: { userId: targetReceiverId } } },
        ],
      },
      select: {
        id: true,
        requestStatus: true,
        requesterId: true,
        participants: { select: { userId: true } },
      },
    });

    if (existing) {
      conversation = existing;
    } else {
      const relation = await prisma.follow.findFirst({
        where: {
          OR: [
            { followerId: senderId, followingId: targetReceiverId },
            { followerId: targetReceiverId, followingId: senderId },
          ],
        },
        select: { followerId: true },
      });

      const isOpenByRelation = Boolean(relation);

      conversation = await prisma.conversation.create({
        data: {
          requestStatus: isOpenByRelation ? ConversationRequestStatus.OPEN : ConversationRequestStatus.PENDING,
          requesterId: isOpenByRelation ? null : senderId,
          participants: {
            create: [{ userId: senderId }, { userId: targetReceiverId }],
          },
        },
        select: {
          id: true,
          requestStatus: true,
          requesterId: true,
          participants: { select: { userId: true } },
        },
      });

      if (!isOpenByRelation) {
        await prisma.notification.create({
          data: {
            userId: targetReceiverId,
            type: "MESSAGE_REQUEST",
            title: "Nueva solicitud de conversación",
            body: "Alguien que no sigues te escribió. Revisa el chat para aceptar o rechazar.",
            metadata: { conversationId: conversation.id, senderId },
          },
        });
      }
    }
  }

  if (!conversation) {
    return res.status(400).json({ error: "No se pudo resolver la conversación" });
  }

  const isSenderParticipant = conversation.participants.some((participant) => participant.userId === senderId);
  if (!isSenderParticipant) {
    return res.status(403).json({ error: "Sin acceso a esta conversación" });
  }

  const otherParticipant = conversation.participants.find((participant) => participant.userId !== senderId);
  if (!otherParticipant) {
    return res.status(400).json({ error: "No se pudo identificar el destinatario" });
  }

  if (conversation.requestStatus === ConversationRequestStatus.REJECTED) {
    return res.status(403).json({ error: "Esta conversación fue rechazada" });
  }

  if (conversation.requestStatus === ConversationRequestStatus.PENDING) {
    if (conversation.requesterId !== senderId) {
      return res.status(403).json({ error: "Debes aceptar o rechazar esta solicitud antes de responder" });
    }

    const trialCount = await prisma.message.count({
      where: { conversationId: conversation.id, senderId },
    });

    if (trialCount >= TRIAL_MESSAGE_LIMIT) {
      return res.status(403).json({ error: "Ya enviaste 3 mensajes. Espera la aceptación de la otra persona." });
    }
  }

  const receiverIdForMessage = otherParticipant.userId;

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId,
      receiverId: receiverIdForMessage,
      content: trimmedContent,
    },
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  await prisma.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });

  await prisma.notification.create({
    data: {
      userId: receiverIdForMessage,
      type: "MESSAGE",
      title: "Nuevo mensaje",
      body: trimmedContent.slice(0, 80),
      metadata: { conversationId: conversation.id, senderId, requestStatus: conversation.requestStatus },
    },
  });

  res.status(201).json({ ...message, conversationId: conversation.id, requestStatus: conversation.requestStatus });
});

export default router;
