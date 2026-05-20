import { Router, Response, type RequestHandler } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, type AuthRequest } from "../middleware/auth.middleware";
import { isAllowedInitialLocation, isSameLocation, normalizeLocation } from "../constants/colombia-locations";

const router = Router();
const authMiddleware = authenticate as unknown as RequestHandler;

const FALLBACK_WORK_AREAS = [
  "Desarrollo de Software",
  "Diseño UI/UX",
  "Data & IA",
  "Marketing Digital",
  "Ventas",
  "Producto",
  "Recursos Humanos",
  "Operaciones",
  "Finanzas",
  "Atención al Cliente",
];

// GET /api/users — búsqueda paginada de usuarios (requiere login)
router.get("/", authMiddleware, async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const q = String(req.query.q ?? "").trim();
  const role = String(req.query.role ?? "").toUpperCase();
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(String(req.query.pageSize ?? "20"), 10) || 20));

  const where: any = {
    isActive: true,
    NOT: {
      email: {
        endsWith: "@demo.joblify.io",
        mode: "insensitive",
      },
    },
  };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { headline: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }
  if (role) {
    where.role = role;
  }

  const [users, total, followings, followers] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        role: true,
        avatarUrl: true,
        headline: true,
        location: true,
        isVerified: true,
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
    prisma.follow.findMany({
      where: { followerId: authReq.user!.id },
      select: { followingId: true },
    }),
    prisma.follow.findMany({
      where: { followingId: authReq.user!.id },
      select: { followerId: true },
    }),
  ]);

  const followingSet = new Set(followings.map((f) => f.followingId));
  const followerSet = new Set(followers.map((f) => f.followerId));

  const data = users.map((u) => ({
    ...u,
    isFollowing: followingSet.has(u.id),
    isFollower: followerSet.has(u.id),
  }));

  res.json({ data, pagination: { page, pageSize, total } });
});

// GET /api/users/public — búsqueda pública de usuarios (sin login)
router.get("/public", async (req, res: Response) => {
  const q = String(req.query.q ?? "").trim();
  const role = String(req.query.role ?? "").toUpperCase();
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(String(req.query.pageSize ?? "20"), 10) || 20));

  const where: any = {
    isActive: true,
    NOT: {
      email: {
        endsWith: "@demo.joblify.io",
        mode: "insensitive",
      },
    },
  };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { headline: { contains: q, mode: "insensitive" } },
    ];
  }
  if (role) {
    where.role = role;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        role: true,
        avatarUrl: true,
        headline: true,
        location: true,
        isVerified: true,
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  res.json({ data: users, pagination: { page, pageSize, total } });
});

// GET /api/users/me — obtener propio perfil
router.get("/me", authMiddleware, async (req, res: Response) => {
  const authReq = req as AuthRequest;
  try {
    const user = await prisma.user.findUnique({
      where: { id: authReq.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        coverUrl: true,
        headline: true,
        bio: true,
        location: true,
        phone: true,
        website: true,
        linkedinUrl: true,
        githubUrl: true,
        isVerified: true,
        profileCompletion: true,
        plan: true,
        matchScore: true,
        profileData: true,
        skills: { include: { skill: true } },
        experience: { orderBy: { startDate: "desc" } },
        education: { orderBy: { startDate: "desc" } },
        createdAt: true,
      },
    });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener perfil" });
  }
});

// GET /api/users/me/stats — métricas reales para sidebar de perfil
router.get("/me/stats", authMiddleware, async (req, res: Response) => {
  const authReq = req as AuthRequest;
  try {
    const [user, followersCount, followingCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: authReq.user!.id },
        select: {
          isVerified: true,
          profileCompletion: true,
          matchScore: true,
        },
      }),
      prisma.follow.count({ where: { followingId: authReq.user!.id } }),
      prisma.follow.count({ where: { followerId: authReq.user!.id } }),
    ]);

    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    const numericMatchScore = user.matchScore !== null && user.matchScore !== undefined
      ? Number(user.matchScore)
      : null;

    res.json({
      isVerified: user.isVerified,
      profileCompletion: user.profileCompletion,
      matchScore: Number.isFinite(numericMatchScore) ? numericMatchScore : null,
      followersCount,
      followingCount,
      connectionsCount: followersCount + followingCount,
    });
  } catch {
    res.status(500).json({ error: "Error al obtener métricas del perfil" });
  }
});

// GET /api/users/work-areas — catálogo de áreas desde perfiles + fallback
router.get("/work-areas", authMiddleware, async (_req, res: Response) => {
  try {
    const rows = await prisma.$queryRaw<Array<{ workArea: string | null }>>`
      SELECT DISTINCT NULLIF(TRIM("profileData"->>'workArea'), '') AS "workArea"
      FROM "users"
      WHERE "profileData" IS NOT NULL
    `;

    const fromDb = rows
      .map((row) => row.workArea?.trim())
      .filter((area): area is string => Boolean(area));

    const areas = Array.from(new Set([...fromDb, ...FALLBACK_WORK_AREAS])).sort((a, b) => a.localeCompare(b));
    res.json({ areas });
  } catch {
    res.json({ areas: FALLBACK_WORK_AREAS });
  }
});

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  headline: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  githubUrl: z.string().url().optional().or(z.literal("")),
  profileData: z.any().optional(),
  avatarUrl: z.string().optional(),
  coverUrl: z.string().optional(),
});

// GET /api/users/:id — perfil público
router.get("/:id", async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id, isActive: true },
    select: {
      id: true, name: true, role: true, avatarUrl: true, coverUrl: true,
      headline: true, bio: true, location: true, website: true,
      linkedinUrl: true, isVerified: true, profileCompletion: true,
      matchScore: true, createdAt: true,
      skills: { include: { skill: true } },
      experience: { orderBy: { startDate: "desc" } },
      education: { orderBy: { startDate: "desc" } },
      certifications: { orderBy: { issueDate: "desc" } },
    },
  });
  if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
  res.json(user);
});

// GET /api/users/:id/follow-status — estado de follow
router.get("/:id/follow-status", authMiddleware, async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const targetId = req.params.id;
  if (targetId === authReq.user!.id) return res.json({ isFollowing: false, isFollower: false });

  const [following, follower] = await Promise.all([
    prisma.follow.findUnique({ where: { followerId_followingId: { followerId: authReq.user!.id, followingId: targetId } } }),
    prisma.follow.findUnique({ where: { followerId_followingId: { followerId: targetId, followingId: authReq.user!.id } } }),
  ]);

  res.json({ isFollowing: Boolean(following), isFollower: Boolean(follower) });
});

// POST /api/users/:id/follow — toggle follow
router.post("/:id/follow", authMiddleware, async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const targetId = req.params.id;
  if (targetId === authReq.user!.id) return res.status(400).json({ error: "No puedes seguirte a ti misma" });

  const existing = await prisma.follow.findUnique({ where: { followerId_followingId: { followerId: authReq.user!.id, followingId: targetId } } });

  if (existing) {
    await prisma.follow.delete({ where: { followerId_followingId: { followerId: authReq.user!.id, followingId: targetId } } });
    return res.json({ isFollowing: false });
  }

  await prisma.follow.create({ data: { followerId: authReq.user!.id, followingId: targetId } });

  const follower = await prisma.user.findUnique({
    where: { id: authReq.user!.id },
    select: { id: true, name: true },
  });

  await prisma.notification.create({
    data: {
      userId: targetId,
      type: "FOLLOW",
      title: "Tienes un nuevo seguidor",
      body: `${follower?.name || "Alguien"} empezó a seguirte.`,
      metadata: {
        followerId: authReq.user!.id,
      },
    },
  });

  res.json({ isFollowing: true });
});

// PUT /api/users/me — actualizar propio perfil
router.put("/me", authMiddleware, async (req, res: Response) => {
  const authReq = req as AuthRequest;
  try {
    console.log("=== INICIANDO ACTUALIZACION DE PERFIL ===");
    console.log("Datos recibidos en req.body:", Object.keys(req.body));
    if (req.body.avatarUrl) {
      console.log("Longitud de avatarUrl recibido:", req.body.avatarUrl.length, "caracteres");
    }
    
    const data = updateProfileSchema.parse(req.body);
    console.log("Datos que pasaron la validación de Zod:", Object.keys(data));

    const currentUser = await prisma.user.findUnique({
      where: { id: authReq.user!.id },
      select: { location: true },
    });

    if (data.location !== undefined && data.location !== "") {
      const normalizedLocation = normalizeLocation(data.location);
      const isAllowed =
        isAllowedInitialLocation(normalizedLocation) ||
        isSameLocation(currentUser?.location, normalizedLocation);

      if (!isAllowed) {
        return res.status(400).json({
          error: "Ubicación no válida para esta etapa. Usa una ciudad de Colombia, Remote / Remoto u Otra.",
        });
      }

      data.location = normalizedLocation;
    }

    const fieldsWithValue = Object.values(data).filter(v => v !== undefined && v !== "").length;
    const completionBonus = Math.min(fieldsWithValue * 10, 75);

    const user = await prisma.user.update({
      where: { id: authReq.user!.id },
      data: {
        ...data,
        profileCompletion: { increment: completionBonus },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        headline: true,
        bio: true,
        location: true,
        profileCompletion: true,
        plan: true,
        profileData: true,
      },
    });
    
    console.log("Perfil actualizado en BD con éxito.");
    console.log("=========================================");
    
    res.json(user);
  } catch (err) {
    console.error("=== ERROR ACTUALIZANDO PERFIL ===", err);
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: "Error al actualizar perfil" });
  }
});

// POST /api/users/me/skills — agregar skills
router.post("/me/skills", authMiddleware, async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const { skills } = req.body as { skills: string[] };
  if (!Array.isArray(skills)) return res.status(400).json({ error: "skills debe ser un array" });

  for (const name of skills) {
    const skill = await prisma.skill.upsert({ where: { name }, create: { name }, update: {} });
    await prisma.userSkill.upsert({
      where: { userId_skillId: { userId: authReq.user!.id, skillId: skill.id } },
      create: { userId: authReq.user!.id, skillId: skill.id },
      update: {},
    });
  }
  const updated = await prisma.userSkill.findMany({
    where: { userId: authReq.user!.id },
    include: { skill: true },
  });
  res.json(updated);
});

// PUT /api/users/me/skills — sincronizar skills (replace)
router.put("/me/skills", authMiddleware, async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const schema = z.object({ skills: z.array(z.string()) });

  try {
    const { skills } = schema.parse(req.body);
    const normalized = Array.from(new Set(skills.map((name) => name.trim()).filter(Boolean)));

    if (normalized.length === 0) {
      await prisma.userSkill.deleteMany({ where: { userId: authReq.user!.id } });
      return res.json([]);
    }

    const existingSkills = await prisma.skill.findMany({
      where: { name: { in: normalized } },
      select: { name: true },
    });

    const existingNames = new Set(existingSkills.map((skill) => skill.name));
    const missingNames = normalized.filter((name) => !existingNames.has(name));

    if (missingNames.length > 0) {
      await prisma.skill.createMany({
        data: missingNames.map((name) => ({ name })),
        skipDuplicates: true,
      });
    }

    const allSkills = await prisma.skill.findMany({
      where: { name: { in: normalized } },
      select: { id: true },
    });

    const skillIds = allSkills.map((skill) => skill.id);

    await prisma.userSkill.deleteMany({
      where: {
        userId: authReq.user!.id,
        skillId: { notIn: skillIds },
      },
    });

    await prisma.userSkill.createMany({
      data: skillIds.map((skillId) => ({ userId: authReq.user!.id, skillId })),
      skipDuplicates: true,
    });

    const updated = await prisma.userSkill.findMany({
      where: { userId: authReq.user!.id },
      include: { skill: true },
    });

    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: "Error al sincronizar skills" });
  }
});

// POST /api/users/me/experience
router.post("/me/experience", authMiddleware, async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const schema = z.object({
    title: z.string(),
    company: z.string(),
    location: z.string().optional(),
    startDate: z.string(),
    endDate: z.string().optional(),
    current: z.boolean().default(false),
    description: z.string().optional(),
  });
  try {
    const data = schema.parse(req.body);
    const exp = await prisma.experience.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        userId: authReq.user!.id,
      },
    });
    res.status(201).json(exp);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: "Error al guardar experiencia" });
  }
});

// PUT /api/users/me/experience/:id — editar experiencia propia
router.put("/me/experience/:id", authMiddleware, async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const schema = z.object({
    title: z.string().optional(),
    company: z.string().optional(),
    location: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    current: z.boolean().optional(),
    description: z.string().optional(),
  });

  try {
    const data = schema.parse(req.body);
    const existing = await prisma.experience.findFirst({
      where: { id: req.params.id, userId: authReq.user!.id },
      select: { id: true },
    });

    if (!existing) return res.status(404).json({ error: "Experiencia no encontrada" });

    const updated = await prisma.experience.update({
      where: { id: existing.id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate === "" ? null : data.endDate ? new Date(data.endDate) : undefined,
      },
    });

    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: "Error al actualizar experiencia" });
  }
});

// DELETE /api/users/me/experience/:id — eliminar experiencia propia
router.delete("/me/experience/:id", authMiddleware, async (req, res: Response) => {
  const authReq = req as AuthRequest;
  try {
    const existing = await prisma.experience.findFirst({
      where: { id: req.params.id, userId: authReq.user!.id },
      select: { id: true },
    });

    if (!existing) return res.status(404).json({ error: "Experiencia no encontrada" });

    await prisma.experience.delete({ where: { id: existing.id } });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Error al eliminar experiencia" });
  }
});

// POST /api/users/me/education
router.post("/me/education", authMiddleware, async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const schema = z.object({
    institution: z.string(),
    degree: z.string(),
    field: z.string().optional(),
    startDate: z.string(),
    endDate: z.string().optional(),
    current: z.boolean().default(false),
  });
  try {
    const data = schema.parse(req.body);
    const edu = await prisma.education.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        userId: authReq.user!.id,
      },
    });
    res.status(201).json(edu);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: "Error al guardar educación" });
  }
});

// PUT /api/users/me/education/:id — editar educación propia
router.put("/me/education/:id", authMiddleware, async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const schema = z.object({
    institution: z.string().optional(),
    degree: z.string().optional(),
    field: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    current: z.boolean().optional(),
  });

  try {
    const data = schema.parse(req.body);
    const existing = await prisma.education.findFirst({
      where: { id: req.params.id, userId: authReq.user!.id },
      select: { id: true },
    });

    if (!existing) return res.status(404).json({ error: "Educación no encontrada" });

    const updated = await prisma.education.update({
      where: { id: existing.id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate === "" ? null : data.endDate ? new Date(data.endDate) : undefined,
      },
    });

    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: "Error al actualizar educación" });
  }
});

// DELETE /api/users/me/education/:id — eliminar educación propia
router.delete("/me/education/:id", authMiddleware, async (req, res: Response) => {
  const authReq = req as AuthRequest;
  try {
    const existing = await prisma.education.findFirst({
      where: { id: req.params.id, userId: authReq.user!.id },
      select: { id: true },
    });

    if (!existing) return res.status(404).json({ error: "Educación no encontrada" });

    await prisma.education.delete({ where: { id: existing.id } });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Error al eliminar educación" });
  }
});

export default router;
