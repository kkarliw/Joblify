import { Router, Response } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { authenticate, requireRole, type AuthRequest } from "../middleware/auth.middleware";

const router = Router();

const HIDDEN_MOCK_JOB_TITLES = ["senior product designer", "backend engineer (go)"];

const LIST_SORTS = ["recent", "relevance", "salary_high", "salary_low", "most_viewed"] as const;
const MODALITIES = ["REMOTO", "HIBRIDO", "PRESENCIAL"] as const;
const JOB_TYPES = ["FULL_TIME", "PART_TIME", "FREELANCE", "PASANTIA"] as const;

const toSingleString = (value: unknown) => {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return "";
};

const toPositiveInt = (value: unknown, fallback: number) => {
  const parsed = Number.parseInt(toSingleString(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const toOptionalNumber = (value: unknown) => {
  const raw = toSingleString(value);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

const toArrayFromCsv = (value: unknown) => {
  const raw = toSingleString(value);
  if (!raw) return [];
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const getSort = (value: unknown): (typeof LIST_SORTS)[number] => {
  const parsed = toSingleString(value);
  return LIST_SORTS.includes(parsed as (typeof LIST_SORTS)[number])
    ? (parsed as (typeof LIST_SORTS)[number])
    : "recent";
};

const jobSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(20),
  requirements: z.string().optional(),
  benefits: z.string().optional(),
  location: z.string(),
  modality: z.enum(["REMOTO", "HIBRIDO", "PRESENCIAL"]),
  type: z.enum(["FULL_TIME", "PART_TIME", "FREELANCE", "PASANTIA"]),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  salaryCurrency: z.string().default("USD"),
  skills: z.array(z.string()).optional(),
  categoryId: z.string().optional(),
  expiresAt: z.string().optional(),
});

// GET /api/jobs — listado público con filtros
router.get("/", async (req, res) => {
  const q = toSingleString(req.query.q).trim();
  const location = toSingleString(req.query.location).trim();
  const modality = toSingleString(req.query.modality).trim();
  const type = toSingleString(req.query.type).trim();
  const categoryId = toSingleString(req.query.categoryId).trim();
  const skills = toArrayFromCsv(req.query.skills);
  const salaryMin = toOptionalNumber(req.query.salaryMin);
  const salaryMax = toOptionalNumber(req.query.salaryMax);
  const postedWithinDays = toPositiveInt(req.query.postedWithinDays, 0);
  const page = toPositiveInt(req.query.page, 1);
  const limit = Math.min(toPositiveInt(req.query.limit, 20), 100);
  const sort = getSort(req.query.sort);

  const where: Prisma.JobWhereInput = {
    isActive: true,
    NOT: {
      title: {
        in: HIDDEN_MOCK_JOB_TITLES,
        mode: "insensitive",
      },
    },
  };

  const andConditions: Prisma.JobWhereInput[] = [];

  if (q) {
    andConditions.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { requirements: { contains: q, mode: "insensitive" } },
        { benefits: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
        { poster: { name: { contains: q, mode: "insensitive" } } },
        {
          skills: {
            some: {
              skill: { name: { contains: q, mode: "insensitive" } },
            },
          },
        },
      ],
    });
  }

  if (location) {
    andConditions.push({
      location: { contains: location, mode: "insensitive" },
    });
  }

  if (modality) {
    const parsedModality = z.enum(MODALITIES).safeParse(modality);
    if (parsedModality.success) {
      andConditions.push({ modality: parsedModality.data });
    }
  }

  if (type) {
    const parsedType = z.enum(JOB_TYPES).safeParse(type);
    if (parsedType.success) {
      andConditions.push({ type: parsedType.data });
    }
  }

  if (categoryId) {
    andConditions.push({ categoryId });
  }

  if (salaryMin !== null) {
    andConditions.push({
      OR: [
        { salaryMin: { gte: salaryMin } },
        { salaryMax: { gte: salaryMin } },
      ],
    });
  }

  if (salaryMax !== null) {
    andConditions.push({
      OR: [
        { salaryMin: { lte: salaryMax } },
        { salaryMax: { lte: salaryMax } },
      ],
    });
  }

  if (skills.length > 0) {
    andConditions.push({
      OR: skills.map((skillName) => ({
        skills: {
          some: {
            skill: {
              name: { equals: skillName, mode: "insensitive" },
            },
          },
        },
      })),
    });
  }

  if (postedWithinDays > 0) {
    const since = new Date();
    since.setDate(since.getDate() - postedWithinDays);
    andConditions.push({
      createdAt: { gte: since },
    });
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  const orderBy: Prisma.JobOrderByWithRelationInput[] =
    sort === "salary_high"
      ? [{ salaryMax: "desc" }, { salaryMin: "desc" }, { createdAt: "desc" }]
      : sort === "salary_low"
        ? [{ salaryMin: "asc" }, { salaryMax: "asc" }, { createdAt: "desc" }]
        : sort === "most_viewed"
          ? [{ viewCount: "desc" }, { createdAt: "desc" }]
          : sort === "relevance" && q
            ? [{ isFeatured: "desc" }, { applyCount: "desc" }, { viewCount: "desc" }, { createdAt: "desc" }]
            : [{ isFeatured: "desc" }, { createdAt: "desc" }];

  const skip = (page - 1) * limit;
  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      include: {
        poster: { select: { id: true, name: true, avatarUrl: true, isVerified: true } },
        skills: { include: { skill: true } },
        category: true,
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.job.count({ where }),
  ]);

  res.json({ jobs, total, page, pages: Math.ceil(total / limit) });
});

// GET /api/jobs/:id
router.get("/:id", async (req, res) => {
  const job = await prisma.job.findUnique({
    where: { id: req.params.id },
    include: {
      poster: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          coverUrl: true,
          headline: true,
          bio: true,
          location: true,
          website: true,
          linkedinUrl: true,
          isVerified: true,
        },
      },
      skills: { include: { skill: true } },
      category: true,
      _count: { select: { applications: true } },
    },
  });

  const isHiddenMock = Boolean(job?.title && HIDDEN_MOCK_JOB_TITLES.includes(job.title.toLowerCase()));
  if (!job || !job.isActive || isHiddenMock) return res.status(404).json({ error: "Vacante no encontrada" });

  const [companyActiveJobsCount, companyHiresCount, relatedJobs] = await Promise.all([
    prisma.job.count({
      where: {
        posterId: job.posterId,
        isActive: true,
      },
    }),
    prisma.application.count({
      where: {
        job: { posterId: job.posterId },
        status: "CONTRATADO",
      },
    }),
    prisma.job.findMany({
      where: {
        posterId: job.posterId,
        isActive: true,
        id: { not: job.id },
      },
      select: {
        id: true,
        title: true,
        location: true,
        modality: true,
        type: true,
        salaryMin: true,
        salaryMax: true,
        salaryCurrency: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);

  await prisma.job.update({ where: { id: req.params.id }, data: { viewCount: { increment: 1 } } });

  res.json({
    ...job,
    companyStats: {
      activeJobs: companyActiveJobsCount,
      hires: companyHiresCount,
    },
    relatedJobs,
  });
});

// POST /api/jobs — solo EMPRESA
router.post("/", authenticate, requireRole("EMPRESA"), async (req: AuthRequest, res: Response) => {
  try {
    const data = jobSchema.parse(req.body);
    const { skills, expiresAt, ...jobData } = data;

    const job = await prisma.job.create({
      data: {
        ...jobData,
        posterId: req.user!.id,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        skills: skills ? {
          create: await Promise.all(skills.map(async (name) => {
            const skill = await prisma.skill.upsert({
              where: { name },
              create: { name },
              update: {},
            });
            return { skillId: skill.id };
          })),
        } : undefined,
      },
      include: { skills: { include: { skill: true } } },
    });

    res.status(201).json(job);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: "Error al crear vacante" });
  }
});

// PUT /api/jobs/:id
router.put("/:id", authenticate, requireRole("EMPRESA"), async (req: AuthRequest, res: Response) => {
  const job = await prisma.job.findUnique({ where: { id: req.params.id } });
  if (!job || job.posterId !== req.user!.id) return res.status(403).json({ error: "Sin permiso" });

  try {
    const parsed = jobSchema.partial().parse(req.body);
    const { skills: _skills, categoryId, expiresAt, ...rest } = parsed;

    const data: Prisma.JobUncheckedUpdateInput = {
      ...rest,
      ...(categoryId !== undefined ? { categoryId: categoryId || null } : {}),
      ...(expiresAt !== undefined ? { expiresAt: expiresAt ? new Date(expiresAt) : null } : {}),
    };

    const updated = await prisma.job.update({ where: { id: req.params.id }, data });
    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: "Error al actualizar" });
  }
});

// DELETE /api/jobs/:id
router.delete("/:id", authenticate, requireRole("EMPRESA"), async (req: AuthRequest, res: Response) => {
  const job = await prisma.job.findUnique({ where: { id: req.params.id } });
  if (!job || job.posterId !== req.user!.id) return res.status(403).json({ error: "Sin permiso" });
  await prisma.job.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.json({ message: "Vacante desactivada" });
});

// GET /api/jobs/my/posted — vacantes de la empresa logueada
router.get("/my/posted", authenticate, requireRole("EMPRESA"), async (req: AuthRequest, res: Response) => {
  const jobs = await prisma.job.findMany({
    where: { posterId: req.user!.id },
    include: {
      skills: { include: { skill: true } },
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(jobs);
});

export default router;
