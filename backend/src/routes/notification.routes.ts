import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, type AuthRequest } from "../middleware/auth.middleware";

const router = Router();

// GET /api/notifications
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const unreadCount = notifications.filter(n => !n.isRead).length;
  res.json({ notifications, unreadCount });
});

// PATCH /api/notifications/read-all
router.patch("/read-all", authenticate, async (req: AuthRequest, res: Response) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.id, isRead: false },
    data: { isRead: true },
  });
  res.json({ message: "Todas marcadas como leídas" });
});

// PATCH /api/notifications/:id/read
router.patch("/:id/read", authenticate, async (req: AuthRequest, res: Response) => {
  await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.user!.id },
    data: { isRead: true },
  });
  res.json({ message: "Notificación marcada como leída" });
});

export default router;
