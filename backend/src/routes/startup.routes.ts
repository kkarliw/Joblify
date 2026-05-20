import { Router, Response } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { authenticate, requireRole, type AuthRequest } from "../middleware/auth.middleware";

const router = Router();

const applicationStatusSchema = z.enum(["PENDIENTE", "EN_REVISION", "ACEPTADO", "RECHAZADO"]);
const startupStages = ["Idea", "MVP", "Seed", "Serie A", "Serie B"] as const;
const stageSchema = z.enum(startupStages);

const baseStartupSchema = z.object({
  name: z.string().min(2),
  tagline: z.string().min(5),
  description: z.string().min(20),
  stage: stageSchema,
  sector: z.string().optional(),
  website: z.string().url().optional(),
  deckUrl: z.string().url().optional(),
});

const roleInputSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(10),
  equityMin: z.number().optional(),
  equityMax: z.number().optional(),
});

const startupCreateSchema = baseStartupSchema.extend({
  openRoles: z.array(roleInputSchema).optional(),
});

const startupUpdateSchema = baseStartupSchema.partial().extend({
  isActive: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "Debes enviar al menos un campo para actualizar",
});

const roleUpdateSchema = roleInputSchema.partial().extend({
  isOpen: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "Debes enviar cambios para el rol",
});

const startupInclude = Prisma.validator<Prisma.StartupInclude>()({
  openRoles: {
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { applications: true } },
    },
  },
  _count: { select: { applications: true } },
});

// GET /api/startups
router.get("/", async (req, res) => {
  const { stage, q, page = "1", limit = "20" } = req.query;
  const where: Record<string, unknown> = { isActive: true };
  if (stage) where.stage = stage;
  if (q) where.OR = [
    { name: { contains: String(q), mode: "insensitive" } },
    { tagline: { contains: String(q), mode: "insensitive" } },
  ];

  const skip = (Number(page) - 1) * Number(limit);
  const [startups, total] = await Promise.all([
    prisma.startup.findMany({
      where,
      include: {
        founder: { select: { id: true, name: true, avatarUrl: true, headline: true } },
        openRoles: { where: { isOpen: true } },
        _count: { select: { applications: true } },
      },
      skip,
      take: Number(limit),
      orderBy: { createdAt: "desc" },
    }),
    prisma.startup.count({ where }),
  ]);
  res.json({ startups, total });
});

// POST /api/startups
router.post("/", authenticate, requireRole("EMPRENDEDOR"), async (req: AuthRequest, res: Response) => {
  try {
    const { openRoles, ...data } = startupCreateSchema.parse(req.body);
    const startup = await prisma.startup.create({
      data: {
        ...data,
        founderId: req.user!.id,
        openRoles: openRoles ? { create: openRoles } : undefined,
      },
      include: startupInclude,
    });
    res.status(201).json(startup);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: "Error al crear startup" });
  }
});

// PUT /api/startups/:id
router.put("/:id", authenticate, requireRole("EMPRENDEDOR"), async (req: AuthRequest, res: Response) => {
  try {
    const payload = startupUpdateSchema.parse(req.body);
    const startup = await prisma.startup.findUnique({
      where: { id: req.params.id },
      select: { id: true, founderId: true },
    });
    if (!startup) return res.status(404).json({ error: "Startup no encontrada" });
    if (startup.founderId !== req.user!.id) return res.status(403).json({ error: "Sin permiso" });

    const updated = await prisma.startup.update({
      where: { id: startup.id },
      data: payload,
      include: startupInclude,
    });
    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: "Error al actualizar startup" });
  }
});

// DELETE /api/startups/:id
router.delete("/:id", authenticate, requireRole("EMPRENDEDOR"), async (req: AuthRequest, res: Response) => {
  try {
    const startup = await prisma.startup.findUnique({
      where: { id: req.params.id },
      select: { id: true, founderId: true },
    });
    if (!startup) return res.status(404).json({ error: "Startup no encontrada" });
    if (startup.founderId !== req.user!.id) return res.status(403).json({ error: "Sin permiso" });

    await prisma.startup.update({
      where: { id: startup.id },
      data: { isActive: false },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Error al archivar startup" });
  }
});

// POST /api/startups/:id/roles
router.post("/:id/roles", authenticate, requireRole("EMPRENDEDOR"), async (req: AuthRequest, res: Response) => {
  try {
    const payload = roleInputSchema.parse(req.body);
    const startup = await prisma.startup.findUnique({
      where: { id: req.params.id },
      select: { id: true, founderId: true },
    });
    if (!startup) return res.status(404).json({ error: "Startup no encontrada" });
    if (startup.founderId !== req.user!.id) return res.status(403).json({ error: "Sin permiso" });

    const role = await prisma.startupRole.create({
      data: { ...payload, startupId: startup.id },
      include: { _count: { select: { applications: true } } },
    });
    res.status(201).json(role);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: "Error al crear rol" });
  }
});

// PATCH /api/startups/roles/:roleId
router.patch("/roles/:roleId", authenticate, requireRole("EMPRENDEDOR"), async (req: AuthRequest, res: Response) => {
  try {
    const payload = roleUpdateSchema.parse(req.body);
    const role = await prisma.startupRole.findUnique({
      where: { id: req.params.roleId },
      include: { startup: { select: { founderId: true } } },
    });
    if (!role) return res.status(404).json({ error: "Rol no encontrado" });
    if (role.startup.founderId !== req.user!.id) return res.status(403).json({ error: "Sin permiso" });

    const updated = await prisma.startupRole.update({
      where: { id: role.id },
      data: payload,
      include: { _count: { select: { applications: true } } },
    });
    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: "Error al actualizar rol" });
  }
});

// DELETE /api/startups/roles/:roleId
router.delete("/roles/:roleId", authenticate, requireRole("EMPRENDEDOR"), async (req: AuthRequest, res: Response) => {
  try {
    const role = await prisma.startupRole.findUnique({
      where: { id: req.params.roleId },
      include: { startup: { select: { founderId: true } } },
    });
    if (!role) return res.status(404).json({ error: "Rol no encontrado" });
    if (role.startup.founderId !== req.user!.id) return res.status(403).json({ error: "Sin permiso" });

    await prisma.startupRole.delete({ where: { id: role.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar rol" });
  }
});

// POST /api/startups/:id/apply — aplicar como cofundador
router.post("/:id/apply", authenticate, async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    motivation: z.string().min(20),
    roleId: z.string().optional(),
  });
  try {
    const data = schema.parse(req.body);

    const startup = await prisma.startup.findUnique({
      where: { id: req.params.id },
      select: { id: true, founderId: true, name: true },
    });
    if (!startup) return res.status(404).json({ error: "Startup no encontrada" });
    if (startup.founderId === req.user!.id) {
      return res.status(400).json({ error: "No puedes postularte a tu propia startup" });
    }

    if (data.roleId) {
      const role = await prisma.startupRole.findFirst({
        where: { id: data.roleId, startupId: startup.id, isOpen: true },
        select: { id: true },
      });
      if (!role) return res.status(400).json({ error: "El rol seleccionado no está disponible" });
    }

    const existing = await prisma.cofounderApplication.findFirst({
      where: { startupId: startup.id, applicantId: req.user!.id },
      select: { id: true },
    });
    if (existing) {
      return res.status(409).json({ error: "Ya te postulaste a esta startup" });
    }

    const application = await prisma.cofounderApplication.create({
      data: {
        ...data,
        startupId: req.params.id,
        applicantId: req.user!.id,
      },
      include: {
        startup: { select: { id: true, name: true, founderId: true } },
      },
    });

    await prisma.notification.create({
      data: {
        userId: application.startup.founderId,
        type: "COFOUNDER_APPLICATION",
        title: "Nueva postulación a tu startup",
        body: `${req.user!.email} se postuló a ${application.startup.name}`,
        metadata: { startupId: application.startup.id, applicationId: application.id },
      },
    });

    res.status(201).json(application);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: "Error al aplicar" });
  }
});

// GET /api/startups/my/owned — startups del emprendedor logueado
router.get("/my/owned", authenticate, requireRole("EMPRENDEDOR"), async (req: AuthRequest, res: Response) => {
  const startups = await prisma.startup.findMany({
    where: { founderId: req.user!.id },
    include: startupInclude,
    orderBy: { createdAt: "desc" },
  });
  res.json(startups);
});

// GET /api/startups/my/overview — métricas rápidas dashboard
router.get("/my/overview", authenticate, requireRole("EMPRENDEDOR"), async (req: AuthRequest, res: Response) => {
  const [startups, applications] = await Promise.all([
    prisma.startup.count({ where: { founderId: req.user!.id, isActive: true } }),
    prisma.cofounderApplication.findMany({
      where: { startup: { founderId: req.user!.id } },
      select: { status: true },
    }),
  ]);

  const summary = applications.reduce(
    (acc, curr) => {
      acc[curr.status as keyof typeof acc] = (acc[curr.status as keyof typeof acc] || 0) + 1;
      return acc;
    },
    { PENDIENTE: 0, EN_REVISION: 0, ACEPTADO: 0, RECHAZADO: 0 } as Record<string, number>,
  );

  res.json({ startups, applications: summary });
});

// GET /api/startups/my/applications — postulaciones recibidas por mis startups
router.get("/my/applications", authenticate, requireRole("EMPRENDEDOR"), async (req: AuthRequest, res: Response) => {
  const applications = await prisma.cofounderApplication.findMany({
    where: { startup: { founderId: req.user!.id } },
    include: {
      startup: { select: { id: true, name: true, stage: true } },
      role: { select: { id: true, title: true } },
      applicant: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          headline: true,
          location: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(applications);
});

// PATCH /api/startups/applications/:id/status — gestionar estado de postulante
router.patch("/applications/:id/status", authenticate, requireRole("EMPRENDEDOR"), async (req: AuthRequest, res: Response) => {
  const schema = z.object({ status: applicationStatusSchema });

  try {
    const { status } = schema.parse(req.body);
    const existing = await prisma.cofounderApplication.findUnique({
      where: { id: req.params.id },
      include: {
        startup: { select: { id: true, name: true, founderId: true } },
        applicant: { select: { id: true } },
      },
    });

    if (!existing) return res.status(404).json({ error: "Postulación no encontrada" });
    if (existing.startup.founderId !== req.user!.id) {
      return res.status(403).json({ error: "Sin permiso" });
    }

    const updated = await prisma.cofounderApplication.update({
      where: { id: existing.id },
      data: { status },
    });

    await prisma.notification.create({
      data: {
        userId: existing.applicant.id,
        type: "COFOUNDER_APPLICATION_UPDATE",
        title: "Actualización de postulación",
        body: `Tu postulación a ${existing.startup.name} cambió a ${status}`,
        metadata: { startupId: existing.startup.id, applicationId: existing.id, status },
      },
    });

    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: "Error al actualizar estado de postulación" });
  }
});

// GET /api/startups/:id
router.get("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  const startup = await prisma.startup.findUnique({
    where: { id: req.params.id },
    include: {
      ...startupInclude,
      founder: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          headline: true,
          isVerified: true,
          email: req.user?.role === "EMPRENDEDOR" ? true : false,
        },
      },
      applications: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          applicant: { select: { id: true, name: true, headline: true, avatarUrl: true } },
          role: { select: { id: true, title: true } },
        },
      },
    },
  });
  if (!startup) return res.status(404).json({ error: "Startup no encontrada" });
  res.json(startup);
});

export default router;
