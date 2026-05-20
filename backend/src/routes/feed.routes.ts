import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, type AuthRequest } from "../middleware/auth.middleware";

const router = Router();

// GET /api/feed — posts personalizados por rol
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  const { page = "1", limit = "20" } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const posts = await prisma.post.findMany({
    include: {
      author: { select: { id: true, name: true, avatarUrl: true, headline: true, role: true, isVerified: true } },
      _count: { select: { likes: true, comments: true } },
      likes: { where: { userId: req.user!.id }, select: { userId: true } },
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    skip,
    take: Number(limit),
  });

  const formatted = posts.map(p => ({
    ...p,
    likedByMe: p.likes.length > 0,
    likesCount: p._count.likes,
    commentsCount: p._count.comments,
  }));

  res.json(formatted);
});

// GET /api/feed/public — posts públicos sin autenticación
router.get("/public", async (req, res: Response) => {
  const { page = "1", limit = "20" } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const posts = await prisma.post.findMany({
    include: {
      author: { select: { id: true, name: true, avatarUrl: true, headline: true, role: true, isVerified: true } },
      _count: { select: { likes: true, comments: true } },
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    skip,
    take: Number(limit),
  });

  const formatted = posts.map((p) => ({
    ...p,
    likedByMe: false,
    likesCount: p._count.likes,
    commentsCount: p._count.comments,
  }));

  res.json(formatted);
});

// GET /api/feed/user/:userId — posts de un usuario (para perfil público)
router.get("/user/:userId", authenticate, async (req: AuthRequest, res: Response) => {
  const { page = "1", limit = "10" } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const userId = req.params.userId;

  const posts = await prisma.post.findMany({
    where: { authorId: userId },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true, headline: true, role: true, isVerified: true } },
      _count: { select: { likes: true, comments: true } },
      likes: { where: { userId: req.user!.id }, select: { userId: true } },
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    skip,
    take: Number(limit),
  });

  const formatted = posts.map(p => ({
    ...p,
    likedByMe: p.likes.length > 0,
    likesCount: p._count.likes,
    commentsCount: p._count.comments,
  }));

  res.json(formatted);
});

// POST /api/feed — crear post
router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    content: z.string().min(1).max(2000),
    imageUrl: z.string().url().optional(),
    tag: z.string().optional(),
  });
  try {
    const data = schema.parse(req.body);
    const post = await prisma.post.create({
      data: { ...data, authorId: req.user!.id },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, headline: true, role: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });
    res.status(201).json(post);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: "Error al publicar" });
  }
});

// POST /api/feed/:id/like — toggle like
router.post("/:id/like", authenticate, async (req: AuthRequest, res: Response) => {
  const postId = req.params.id;
  const userId = req.user!.id;

  try {
    const existing = await prisma.postLike.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      await prisma.postLike.delete({ where: { userId_postId: { userId, postId } } });
      res.json({ liked: false });
    } else {
      // Usar createMany o ignorar el error si ya existe por peticiones dobles
      await prisma.postLike.create({ data: { userId, postId } });
      res.json({ liked: true });
    }
  } catch (error: any) {
    if (error.code === 'P2002') {
      // Ignorar error silenciosamente si el like ya fue dado
      res.json({ liked: true });
    } else {
      res.status(500).json({ error: "Error al dar like" });
    }
  }
});

// GET /api/feed/:id/comments
router.get("/:id/comments", async (req, res) => {
  const comments = await prisma.comment.findMany({
    where: { postId: req.params.id },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true, headline: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  res.json(comments);
});

// POST /api/feed/:id/comments
router.post("/:id/comments", authenticate, async (req: AuthRequest, res: Response) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: "Comentario vacío" });

  const comment = await prisma.comment.create({
    data: { postId: req.params.id, authorId: req.user!.id, content },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
    },
  });
  res.status(201).json(comment);
});

export default router;
