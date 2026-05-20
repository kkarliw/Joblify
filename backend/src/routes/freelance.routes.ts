import { Router, Response, type RequestHandler } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, requireRole, type AuthRequest } from "../middleware/auth.middleware";

const router = Router();
const authMiddleware = authenticate as unknown as RequestHandler;
const freelancerRoleMiddleware = requireRole("FREELANCER") as unknown as RequestHandler;

// GET /api/freelance/services — marketplace de servicios
router.get("/services", async (req, res) => {
  const { q, category, page = "1", limit = "20" } = req.query;
  const where: Record<string, unknown> = { isActive: true };
  if (q) where.OR = [
    { title: { contains: String(q), mode: "insensitive" } },
    { category: { contains: String(q), mode: "insensitive" } },
  ];
  if (category) where.category = category;

  const skip = (Number(page) - 1) * Number(limit);
  const [services, total] = await Promise.all([
    prisma.freelanceService.findMany({
      where,
      include: {
        freelancer: { select: { id: true, name: true, avatarUrl: true, headline: true, isVerified: true } },
      },
      skip,
      take: Number(limit),
    }),
    prisma.freelanceService.count({ where }),
  ]);

  res.json({ services, total });
});

// POST /api/freelance/services — crear servicio
router.post("/services", authMiddleware, freelancerRoleMiddleware, async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const schema = z.object({
    title: z.string().min(5),
    description: z.string().min(20),
    category: z.string(),
    priceMin: z.number().positive(),
    priceMax: z.number().positive().optional(),
    currency: z.string().default("USD"),
    deliveryDays: z.number().int().positive(),
    portfolio: z.array(z.string()).optional(),
  });
  try {
    const data = schema.parse(req.body);
    const service = await prisma.freelanceService.create({
      data: { ...data, freelancerId: authReq.user!.id },
    });
    res.status(201).json(service);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: "Error al crear servicio" });
  }
});

// GET /api/freelance/my/services — servicios del freelancer autenticado
router.get("/my/services", authMiddleware, freelancerRoleMiddleware, async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const services = await prisma.freelanceService.findMany({
    where: { freelancerId: authReq.user!.id },
    orderBy: { createdAt: "desc" },
  });
  res.json(services);
});

// PUT /api/freelance/services/:id — editar servicio propio
router.put("/services/:id", authMiddleware, freelancerRoleMiddleware, async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const schema = z.object({
    title: z.string().min(5).optional(),
    description: z.string().min(20).optional(),
    category: z.string().optional(),
    priceMin: z.number().positive().optional(),
    priceMax: z.number().positive().nullable().optional(),
    currency: z.string().optional(),
    deliveryDays: z.number().int().positive().optional(),
    isActive: z.boolean().optional(),
    portfolio: z.array(z.string()).optional(),
  });
  try {
    const data = schema.parse(req.body);
    const existing = await prisma.freelanceService.findFirst({
      where: { id: req.params.id, freelancerId: authReq.user!.id },
      select: { id: true },
    });
    if (!existing) return res.status(404).json({ error: "Servicio no encontrado" });

    const updated = await prisma.freelanceService.update({
      where: { id: existing.id },
      data,
    });
    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: "Error al actualizar servicio" });
  }
});

// DELETE /api/freelance/services/:id — eliminar servicio propio
router.delete("/services/:id", authMiddleware, freelancerRoleMiddleware, async (req, res: Response) => {
  const authReq = req as AuthRequest;
  try {
    const existing = await prisma.freelanceService.findFirst({
      where: { id: req.params.id, freelancerId: authReq.user!.id },
      select: { id: true },
    });
    if (!existing) return res.status(404).json({ error: "Servicio no encontrado" });

    await prisma.freelanceService.delete({ where: { id: existing.id } });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Error al eliminar servicio" });
  }
});

// GET /api/freelance/reviews/:id — reseñas públicas de un freelancer
router.get("/reviews/:id", async (req, res: Response) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { reviewedId: req.params.id },
      include: {
        reviewer: { select: { id: true, name: true, avatarUrl: true } },
        project: { select: { id: true, title: true, client: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(reviews);
  } catch {
    res.status(500).json({ error: "Error al obtener reseñas" });
  }
});

// GET /api/freelance/me/profile — perfil freelancer para panel propio
router.get("/me/profile", authMiddleware, freelancerRoleMiddleware, async (req, res: Response) => {
  const authReq = req as AuthRequest;
  try {
    const [services, reviews] = await Promise.all([
      prisma.freelanceService.findMany({
        where: { freelancerId: authReq.user!.id, isActive: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.review.findMany({
        where: { reviewedId: authReq.user!.id },
        include: {
          reviewer: { select: { id: true, name: true, avatarUrl: true } },
          project: { select: { id: true, title: true, client: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const portfolioItems = Array.from(
      new Set(
        services.flatMap((service) =>
          Array.isArray(service.portfolio)
            ? service.portfolio.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
            : []
        )
      )
    );

    const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;

    res.json({
      services,
      portfolioItems,
      reviews,
      stats: {
        reviewsCount: reviews.length,
        avgRating: avgRating ? Number(avgRating.toFixed(1)) : null,
      },
    });
  } catch {
    res.status(500).json({ error: "Error al obtener perfil freelancer" });
  }
});

// GET /api/freelance/projects — proyectos abiertos
router.get("/projects", async (_req, res) => {
  const projects = await prisma.freelanceProject.findMany({
    where: { status: "ACTIVO", freelancerId: null },
    include: {
      client: { select: { id: true, name: true, avatarUrl: true, isVerified: true } },
      _count: { select: { proposals: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(projects);
});

// POST /api/freelance/projects/:id/proposals — enviar propuesta
router.post("/projects/:id/proposals", authMiddleware, freelancerRoleMiddleware, async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const schema = z.object({
    price: z.number().positive(),
    deliveryDays: z.number().int().positive(),
    coverLetter: z.string().min(20),
    serviceId: z.string().optional(),
  });
  try {
    const data = schema.parse(req.body);
    const proposal = await prisma.proposal.create({
      data: { ...data, projectId: req.params.id, freelancerId: authReq.user!.id },
    });
    res.status(201).json(proposal);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: "Error al enviar propuesta" });
  }
});

// GET /api/freelance/my/proposals — mis propuestas
router.get("/my/proposals", authMiddleware, freelancerRoleMiddleware, async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const proposals = await prisma.proposal.findMany({
    where: { freelancerId: authReq.user!.id },
    include: {
      project: {
        include: { client: { select: { id: true, name: true, avatarUrl: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(proposals);
});

// GET /api/freelance/my/earnings — resumen de ingresos
router.get("/my/earnings", authMiddleware, freelancerRoleMiddleware, async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const projects = await prisma.freelanceProject.findMany({
    where: { freelancerId: authReq.user!.id, status: "COMPLETADO" },
    include: { escrow: true },
  });

  const total = projects.reduce((sum, p) => sum + (p.escrow?.amount || p.budget), 0);
  const thisMonth = projects
    .filter(p => new Date(p.updatedAt).getMonth() === new Date().getMonth())
    .reduce((sum, p) => sum + (p.escrow?.amount || p.budget), 0);

  res.json({ total, thisMonth, projectsCompleted: projects.length });
});

export default router;
