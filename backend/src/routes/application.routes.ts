import { Router, Response, RequestHandler } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, requireRole, type AuthRequest } from "../middleware/auth.middleware";
import { emailService } from "../services/email.service";

const router = Router();

const applicationUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const applicationUploadsDir = path.resolve(process.cwd(), "uploads", "applications");

if (!fs.existsSync(applicationUploadsDir)) {
  fs.mkdirSync(applicationUploadsDir, { recursive: true });
}

const isPdfMime = (mimeType?: string) => mimeType === "application/pdf";

const saveApplicationPdf = (file: Express.Multer.File, prefix: string) => {
  const safeOriginalName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${prefix}_${Date.now()}_${safeOriginalName || "document.pdf"}`;
  const absolutePath = path.resolve(applicationUploadsDir, fileName);
  fs.writeFileSync(absolutePath, file.buffer);
  return `/uploads/applications/${fileName}`;
};

const statusLabel: Record<string, string> = {
  APLICADO: "Aplicado",
  SCREENING: "Screening",
  ENTREVISTA: "Entrevista",
  OFERTA: "Oferta",
  CONTRATADO: "Seleccionado",
  RECHAZADO: "No seleccionado",
};

const interviewModeLabel: Record<string, string> = {
  REMOTO: "Remoto",
  PRESENCIAL: "Presencial",
};

const buildApplicationUpdateBody = (status: string, jobTitle: string) => {
  if (status === "CONTRATADO") {
    return `¡Felicidades! Fuiste seleccionado para "${jobTitle}". Bienvenido(a) al equipo.`;
  }
  if (status === "RECHAZADO") {
    return `Gracias por tu postulación a "${jobTitle}". En esta ocasión no fuiste seleccionado(a), pero valoramos mucho tu interés.`;
  }
  return `Tu aplicación a "${jobTitle}" cambió a: ${statusLabel[status] || status}`;
};

const cvAnalysisSchema = z.object({
  score: z.number().min(0).max(100),
  executiveSummary: z.string().min(1),
  strengths: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
  recommendation: z.string().min(1),
  recommendationReason: z.string().min(1),
  rawText: z.string().optional(),
});

// POST /api/applications — candidato aplica a vacante
router.post(
  "/",
  authenticate as unknown as RequestHandler,
  applicationUpload.fields([
    { name: "cv", maxCount: 1 },
    { name: "recommendationLetter", maxCount: 1 },
  ]),
  async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    jobId: z.string(),
    coverLetter: z.string().optional(),
  });
  try {
    const { jobId, coverLetter } = schema.parse(req.body);

    const files = (req.files || {}) as Record<string, Express.Multer.File[]>;
    const cvFile = Array.isArray(files.cv) ? files.cv[0] : undefined;
    const recommendationLetterFile = Array.isArray(files.recommendationLetter)
      ? files.recommendationLetter[0]
      : undefined;

    if (cvFile && !isPdfMime(cvFile.mimetype)) {
      return res.status(400).json({ error: "El CV debe ser un PDF" });
    }

    if (recommendationLetterFile && !isPdfMime(recommendationLetterFile.mimetype)) {
      return res.status(400).json({ error: "La carta de recomendación debe ser un PDF" });
    }

    const exists = await prisma.application.findUnique({
      where: { jobId_applicantId: { jobId, applicantId: req.user!.id } },
    });
    if (exists) return res.status(409).json({ error: "Ya aplicaste a esta vacante", alreadyApplied: true });

    const [job, applicant] = await Promise.all([
      prisma.job.findFirst({
        where: { id: jobId, isActive: true },
        select: { id: true, title: true, posterId: true, poster: { select: { name: true } } },
      }),
      prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { email: true, name: true, profileData: true },
      }),
    ]);

    if (!job) return res.status(404).json({ error: "Vacante no encontrada" });

    const profileData = applicant?.profileData && typeof applicant.profileData === "object"
      ? applicant.profileData as Record<string, unknown>
      : {};

    const profileCvUrl = typeof profileData.cvUrl === "string" ? profileData.cvUrl : undefined;

    const cvUrl = cvFile
      ? saveApplicationPdf(cvFile, `cv_${req.user!.id}`)
      : profileCvUrl;

    if (!cvUrl) {
      return res.status(400).json({
        error: "Debes subir tu CV en Mi Perfil o adjuntarlo en esta postulación.",
      });
    }

    const recommendationLetterUrl = recommendationLetterFile
      ? saveApplicationPdf(recommendationLetterFile, `rec_${req.user!.id}`)
      : undefined;

    const application = await prisma.application.create({
      data: {
        jobId,
        applicantId: req.user!.id,
        coverLetter,
        cvUrl,
        recommendationLetterUrl,
      },
      include: {
        job: { select: { title: true, poster: { select: { name: true } } } },
      },
    });

    await prisma.job.update({ where: { id: jobId }, data: { applyCount: { increment: 1 } } });

    await prisma.notification.create({
      data: {
        userId: job.posterId,
        type: "NEW_APPLICATION",
        title: "Nueva aplicación",
        body: `${req.user!.email} aplicó a tu vacante "${job.title}"`,
        metadata: { applicationId: application.id, jobId },
      },
    });

    if (applicant?.email) {
      try {
        await emailService.sendApplicationSubmittedEmail(
          applicant.email,
          applicant.name || "",
          job.title,
          job.poster?.name || "Empresa",
        );
      } catch (emailError) {
        console.error("[Applications] No se pudo enviar email de confirmación:", emailError);
      }
    }

    res.status(201).json(application);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: "Error al aplicar" });
  }
}
);

// GET /api/applications/my — mis aplicaciones (candidato)
router.get("/my", authenticate, async (req: AuthRequest, res: Response) => {
  const applications = await prisma.application.findMany({
    where: {
      applicantId: req.user!.id,
      job: { is: { isActive: true } },
    },
    include: {
      job: {
        include: {
          poster: { select: { id: true, name: true, avatarUrl: true } },
          skills: { include: { skill: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const applicationIds = applications.map((application) => application.id);

  if (applicationIds.length === 0) {
    return res.json(applications);
  }

  const events = await prisma.notification.findMany({
    where: {
      userId: req.user!.id,
      type: { in: ["APPLICATION_UPDATE", "INTERVIEW_SCHEDULED"] },
    },
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      metadata: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const eventsByApplication = new Map<string, Array<Record<string, unknown>>>();

  for (const event of events) {
    const metadata = event.metadata && typeof event.metadata === "object"
      ? (event.metadata as Record<string, unknown>)
      : null;

    const applicationId = typeof metadata?.applicationId === "string"
      ? metadata.applicationId
      : null;

    if (!applicationId || !applicationIds.includes(applicationId)) {
      continue;
    }

    const current = eventsByApplication.get(applicationId) || [];
    current.push({
      id: event.id,
      type: event.type,
      title: event.title,
      body: event.body,
      metadata,
      createdAt: event.createdAt,
    });
    eventsByApplication.set(applicationId, current);
  }

  const enriched = applications.map((application) => ({
    ...application,
    timeline: [
      {
        id: `created-${application.id}`,
        type: "APPLICATION_CREATED",
        title: "Postulación enviada",
        body: "Tu postulación fue registrada correctamente.",
        metadata: { status: "APLICADO" },
        createdAt: application.createdAt,
      },
      ...(eventsByApplication.get(application.id) || []),
    ],
  }));

  res.json(enriched);
});

// DELETE /api/applications/:id — candidato retira su postulación
router.delete("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const app = await prisma.application.findUnique({
      where: { id: req.params.id },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            posterId: true,
            poster: { select: { name: true } },
          },
        },
      },
    });

    if (!app || app.applicantId !== req.user!.id) {
      return res.status(404).json({ error: "Postulación no encontrada" });
    }

    if (app.status === "CONTRATADO") {
      return res.status(400).json({ error: "No puedes retirar una postulación ya contratada" });
    }

    await prisma.application.delete({ where: { id: app.id } });

    await prisma.job.update({
      where: { id: app.jobId },
      data: { applyCount: { decrement: 1 } },
    });

    await prisma.notification.create({
      data: {
        userId: app.job.posterId,
        type: "APPLICATION_WITHDRAWN",
        title: "Postulación retirada",
        body: `${req.user!.email} retiró su postulación a "${app.job.title}"`,
        metadata: { applicationId: app.id, jobId: app.jobId },
      },
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("[Applications] Error retirando postulación", err);
    res.status(500).json({ error: "Error al retirar postulación" });
  }
});

// GET /api/applications/job/:jobId — aplicaciones por vacante (empresa)
router.get("/job/:jobId", authenticate, requireRole("EMPRESA"), async (req: AuthRequest, res: Response) => {
  const job = await prisma.job.findUnique({ where: { id: req.params.jobId } });
  if (!job || job.posterId !== req.user!.id) return res.status(403).json({ error: "Sin permiso" });

  const applications = await prisma.application.findMany({
    where: { jobId: req.params.jobId },
    include: {
      applicant: {
        select: {
          id: true, name: true, avatarUrl: true, headline: true, location: true,
          matchScore: true, skills: { include: { skill: true } },
        },
      },
    },
    orderBy: { matchScore: "desc" },
  });
  res.json(applications);
});

// POST /api/applications/:id/cv-event — recruiter registra vista/descarga de CV
router.post("/:id/cv-event", authenticate, requireRole("EMPRESA"), async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    event: z.enum(["viewed", "downloaded"]),
  });

  try {
    const { event } = schema.parse(req.body);

    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
      include: {
        job: { select: { id: true, title: true, posterId: true } },
        applicant: { select: { id: true, profileData: true } },
      },
    });

    if (!application || application.job.posterId !== req.user!.id) {
      return res.status(403).json({ error: "Sin permiso" });
    }

    const profileData = application.applicant.profileData && typeof application.applicant.profileData === "object"
      ? application.applicant.profileData as Record<string, unknown>
      : {};

    const cvEvents = Array.isArray(profileData.cvEvents) ? profileData.cvEvents : [];
    const nextCvEvents = [
      ...cvEvents,
      {
        event,
        jobId: application.job.id,
        applicationId: application.id,
        at: new Date().toISOString(),
      },
    ];

    await prisma.user.update({
      where: { id: application.applicant.id },
      data: {
        profileData: {
          ...profileData,
          cvEvents: nextCvEvents,
        } as any,
      },
    });

    await prisma.notification.create({
      data: {
        userId: application.applicant.id,
        type: event === "downloaded" ? "CV_DOWNLOADED" : "CV_VIEWED",
        title: event === "downloaded" ? "Descargaron tu CV" : "Vieron tu CV",
        body: event === "downloaded"
          ? `Un reclutador descargó tu CV para "${application.job.title}".`
          : `Un reclutador revisó tu CV para "${application.job.title}".`,
        metadata: { jobId: application.job.id, applicationId: application.id, event },
      },
    });

    res.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    console.error("[Applications] Error registrando evento CV", err);
    res.status(500).json({ error: "Error registrando evento de CV" });
  }
});

// POST /api/applications/:id/analysis — guardar análisis IA del candidato
router.post("/:id/analysis", authenticate, requireRole("EMPRESA"), async (req: AuthRequest, res: Response) => {
  try {
    const analysis = cvAnalysisSchema.parse(req.body);

    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
      include: {
        job: { select: { id: true, title: true, posterId: true } },
      },
    });

    if (!application || application.job.posterId !== req.user!.id) {
      return res.status(403).json({ error: "Sin permiso" });
    }

    const stamp = new Date().toISOString();
    const serialized = `[[ANALISIS_CV:${stamp}]]\n${JSON.stringify(analysis)}`;
    const mergedNotes = application.notes
      ? `${application.notes}\n\n${serialized}`
      : serialized;

    await prisma.application.update({
      where: { id: application.id },
      data: { notes: mergedNotes },
    });

    return res.json({ ok: true, savedAt: stamp });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    console.error("[Applications] Error guardando análisis CV", err);
    return res.status(500).json({ error: "Error guardando análisis" });
  }
});

// PATCH /api/applications/:id/status — empresa actualiza etapa
router.patch("/:id/status", authenticate, requireRole("EMPRESA"), async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    status: z.enum(["APLICADO", "SCREENING", "ENTREVISTA", "OFERTA", "CONTRATADO", "RECHAZADO"]),
    notes: z.string().optional(),
    sendEmail: z.boolean().optional(),
    companyBranding: z.object({
      displayName: z.string().optional(),
      logoUrl: z.string().url().optional(),
    }).optional(),
    interview: z.object({
      mode: z.enum(["REMOTO", "PRESENCIAL"]),
      scheduledAt: z.string(),
      timezone: z.string().optional(),
      location: z.string().optional(),
      meetingLink: z.string().url().optional(),
      notes: z.string().optional(),
    }).optional(),
  });
  try {
    const { status, notes, sendEmail = true, companyBranding, interview } = schema.parse(req.body);
    const app = await prisma.application.findUnique({
      where: { id: req.params.id },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            posterId: true,
            poster: { select: { name: true } },
          },
        },
        applicant: { select: { email: true, name: true } },
      },
    });
    if (!app || app.job.posterId !== req.user!.id) return res.status(403).json({ error: "Sin permiso" });

    if (status === "ENTREVISTA" && interview) {
      if (interview.mode === "PRESENCIAL" && !interview.location) {
        return res.status(400).json({ error: "La dirección es obligatoria para entrevista presencial" });
      }
      if (interview.mode === "REMOTO" && !interview.meetingLink) {
        return res.status(400).json({ error: "El link de reunión es obligatorio para entrevista remota" });
      }
    }

    const updated = await prisma.application.update({
      where: { id: req.params.id },
      data: { status, notes },
    });

    const interviewMetadata = status === "ENTREVISTA" && interview
      ? {
          interviewMode: interview.mode,
          interviewModeLabel: interviewModeLabel[interview.mode] || interview.mode,
          scheduledAt: interview.scheduledAt,
          timezone: interview.timezone || "America/Bogota",
          location: interview.location,
          meetingLink: interview.meetingLink,
          interviewNotes: interview.notes,
          companyLogoUrl: companyBranding?.logoUrl,
          companyDisplayName: companyBranding?.displayName,
        }
      : {};

    await prisma.notification.create({
      data: {
        userId: app.applicantId,
        type: "APPLICATION_UPDATE",
        title: "Actualización de tu aplicación",
        body: buildApplicationUpdateBody(status, app.job.title),
        metadata: { applicationId: app.id, status, ...interviewMetadata },
      },
    });

    if (status === "ENTREVISTA" && interview) {
      await prisma.notification.create({
        data: {
          userId: app.applicantId,
          type: "INTERVIEW_SCHEDULED",
          title: "Entrevista programada",
          body: `Programaron una entrevista para "${app.job.title}" (${interviewModeLabel[interview.mode] || interview.mode}).`,
          metadata: {
            applicationId: app.id,
            status,
            ...interviewMetadata,
          },
        },
      });
    }

    let emailSent = false;
    let emailError: string | null = null;

    if (sendEmail && app.applicant?.email) {
      try {
        if (status === "ENTREVISTA" && interview) {
          await emailService.sendInterviewScheduledEmail({
            email: app.applicant.email,
            name: app.applicant.name || "",
            jobTitle: app.job.title,
            companyName: companyBranding?.displayName || app.job.poster?.name || "Empresa",
            companyLogoUrl: companyBranding?.logoUrl,
            mode: interview.mode,
            scheduledAt: interview.scheduledAt,
            timezone: interview.timezone || "America/Bogota",
            location: interview.location,
            meetingLink: interview.meetingLink,
            notes: interview.notes,
          });
        } else {
          await emailService.sendApplicationStatusEmail(
            app.applicant.email,
            app.applicant.name || "",
            app.job.title,
            companyBranding?.displayName || app.job.poster?.name || "Empresa",
            status,
          );
        }
        emailSent = true;
      } catch (emailError) {
        console.error("[Applications] No se pudo enviar email de estado:", emailError);
        emailSent = false;
        emailError = "No se pudo enviar el correo al candidato";
      }
    }

    res.json({
      ...updated,
      emailSent,
      emailError,
    });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: "Error al actualizar estado" });
  }
});

// POST /api/applications/job/:jobId/close — cierra vacante y marca no seleccionados
router.post("/job/:jobId/close", authenticate, requireRole("EMPRESA"), async (req: AuthRequest, res: Response) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.jobId },
      select: {
        id: true,
        title: true,
        posterId: true,
        poster: { select: { name: true } },
      },
    });

    if (!job || job.posterId !== req.user!.id) {
      return res.status(403).json({ error: "Sin permiso" });
    }

    const affectedApps = await prisma.application.findMany({
      where: {
        jobId: job.id,
        status: { in: ["APLICADO", "SCREENING", "ENTREVISTA", "OFERTA"] },
      },
      select: {
        id: true,
        applicantId: true,
        applicant: { select: { email: true, name: true } },
      },
    });

    if (affectedApps.length > 0) {
      await prisma.application.updateMany({
        where: { id: { in: affectedApps.map((app) => app.id) } },
        data: { status: "RECHAZADO" },
      });

      await prisma.notification.createMany({
        data: affectedApps.map((app) => ({
          userId: app.applicantId,
          type: "APPLICATION_UPDATE",
          title: "Resultado de postulación",
          body: `El proceso para "${job.title}" finalizó. En esta ocasión no fuiste seleccionado.`,
          metadata: { applicationId: app.id, jobId: job.id, status: "RECHAZADO", closedByJob: true },
        })),
      });
    }

    await prisma.job.update({
      where: { id: job.id },
      data: { isActive: false },
    });

    await Promise.all(
      affectedApps
        .filter((app) => Boolean(app.applicant?.email))
        .map(async (app) => {
          try {
            await emailService.sendJobClosedNotSelectedEmail(
              app.applicant!.email!,
              app.applicant!.name || "",
              job.title,
              job.poster?.name || "Empresa",
            );
          } catch (emailError) {
            console.error("[Applications] Error enviando email de cierre:", emailError);
          }
        }),
    );

    res.json({ ok: true, affected: affectedApps.length });
  } catch (err) {
    console.error("[Applications] Error cerrando vacante", err);
    res.status(500).json({ error: "Error cerrando vacante" });
  }
});

export default router;
