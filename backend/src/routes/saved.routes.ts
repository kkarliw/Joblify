import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, type AuthRequest } from "../middleware/auth.middleware";

const router = Router();

// GET /api/saved/jobs
router.get("/jobs", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const savedJobs = await prisma.savedJob.findMany({
      where: { userId: req.user!.id },
      include: {
        job: {
          include: {
            poster: { select: { name: true } },
            skills: { include: { skill: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    
    // Transform to match frontend needs
    const formatted = savedJobs.map(sj => ({
      id: sj.job.id,
      title: sj.job.title,
      company: sj.job.poster?.name || "Empresa",
      location: sj.job.location,
      modality: sj.job.modality,
      salary: sj.job.salaryMin && sj.job.salaryMax 
        ? `${sj.job.salaryCurrency} ${sj.job.salaryMin} - ${sj.job.salaryMax}` 
        : "A convenir",
      savedAt: sj.createdAt
    }));
    
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener vacantes guardadas" });
  }
});

// POST /api/saved/jobs/:id
router.post("/jobs/:id", authenticate, async (req: AuthRequest, res: Response) => {
  const jobId = req.params.id;
  const userId = req.user!.id;

  try {
    const existing = await prisma.savedJob.findUnique({
      where: { userId_jobId: { userId, jobId } },
    });

    if (existing) {
      await prisma.savedJob.delete({ where: { userId_jobId: { userId, jobId } } });
      res.json({ saved: false });
    } else {
      await prisma.savedJob.create({ data: { userId, jobId } });
      res.json({ saved: true });
    }
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar vacante guardada" });
  }
});

// GET /api/saved/posts
router.get("/posts", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const savedPosts = await prisma.savedPost.findMany({
      where: { userId: req.user!.id },
      include: {
        post: {
          include: {
            author: { select: { name: true, avatarUrl: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    
    // Transform to match frontend needs
    const formatted = savedPosts.map(sp => ({
      id: sp.post.id,
      authorName: sp.post.author.name,
      authorAvatarUrl: sp.post.author.avatarUrl,
      content: sp.post.content,
      createdAt: sp.post.createdAt,
      savedAt: sp.createdAt
    }));
    
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener posts guardados" });
  }
});

// POST /api/saved/posts/:id
router.post("/posts/:id", authenticate, async (req: AuthRequest, res: Response) => {
  const postId = req.params.id;
  const userId = req.user!.id;

  try {
    const existing = await prisma.savedPost.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      await prisma.savedPost.delete({ where: { userId_postId: { userId, postId } } });
      res.json({ saved: false });
    } else {
      await prisma.savedPost.create({ data: { userId, postId } });
      res.json({ saved: true });
    }
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar post guardado" });
  }
});

export default router;
