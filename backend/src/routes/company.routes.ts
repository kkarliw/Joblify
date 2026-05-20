import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// GET /api/companies/:id — detalle público de empresa + vacantes activas
router.get("/:id", async (req, res) => {
  const companyId = req.params.id;

  const company = await prisma.user.findFirst({
    where: { id: companyId, role: "EMPRESA", isActive: true },
    select: {
      id: true,
      name: true,
      headline: true,
      bio: true,
      location: true,
      website: true,
      linkedinUrl: true,
      avatarUrl: true,
      coverUrl: true,
      isVerified: true,
      plan: true,
      profileData: true,
      createdAt: true,
    },
  });

  if (!company) {
    return res.status(404).json({ error: "Empresa no encontrada" });
  }

  const profileData = company.profileData && typeof company.profileData === "object"
    ? company.profileData as Record<string, unknown>
    : {};

  const companyProfile = {
    industry: typeof profileData.industry === "string" ? profileData.industry : null,
    companySize: typeof profileData.companySize === "string" ? profileData.companySize : null,
    foundedYear: typeof profileData.foundedYear === "number"
      ? profileData.foundedYear
      : typeof profileData.foundedYear === "string"
        ? Number.parseInt(profileData.foundedYear, 10)
        : null,
    teamSize: typeof profileData.teamSize === "string" ? profileData.teamSize : null,
    specialties: Array.isArray(profileData.specialties)
      ? profileData.specialties.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
      : [],
    cultureValues: Array.isArray(profileData.cultureValues)
      ? profileData.cultureValues.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
      : [],
    benefits: Array.isArray(profileData.benefits)
      ? profileData.benefits.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
      : [],
    companyOverview: typeof profileData.companyOverview === "string" ? profileData.companyOverview : null,
    hiringEmail: typeof profileData.hiringEmail === "string" ? profileData.hiringEmail : null,
  };

  const [jobs, activeJobsCount, hiresCount, inProcessCount] = await Promise.all([
    prisma.job.findMany({
      where: { posterId: companyId, isActive: true },
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
        applyCount: true,
        viewCount: true,
        description: true,
        requirements: true,
        benefits: true,
        category: {
          select: {
            name: true,
          },
        },
        skills: {
          select: {
            skill: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.job.count({ where: { posterId: companyId, isActive: true } }),
    prisma.application.count({ where: { job: { posterId: companyId }, status: "CONTRATADO" } }),
    prisma.application.count({ where: { job: { posterId: companyId }, status: { in: ["APLICADO", "SCREENING", "ENTREVISTA", "OFERTA"] } } }),
  ]);

  res.json({
    ...company,
    companyProfile,
    stats: {
      activeJobs: activeJobsCount,
      inProcess: inProcessCount,
      hires: hiresCount,
    },
    jobs,
  });
});

export default router;
