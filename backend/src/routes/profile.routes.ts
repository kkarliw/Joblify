import { Router, Response, RequestHandler } from "express";
import multer from "multer";
import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";
import { aiService } from "../services/ai.service";
import { authenticate, AuthRequest } from "../middleware/auth.middleware";

const router = Router();
const prisma = new PrismaClient();
const profileUploadsDir = path.resolve(process.cwd(), "uploads", "profile");

if (!fs.existsSync(profileUploadsDir)) {
  fs.mkdirSync(profileUploadsDir, { recursive: true });
}

// Configurar multer para almacenar el archivo en memoria (RAM)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // Limitar a 5MB
});

// POST /api/profile/upload-cv
router.post("/upload-cv", authenticate as unknown as RequestHandler, upload.single("cv"), async (req, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const file = authReq.file;
    const userId = authReq.user?.id;

    if (!file) {
      return res.status(400).json({ error: "No se subió ningún archivo PDF" });
    }

    if (file.mimetype !== "application/pdf") {
      return res.status(400).json({ error: "El archivo debe ser un PDF" });
    }

    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const safeOriginalName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storedFileName = `cv_${userId}_${Date.now()}_${safeOriginalName || "perfil.pdf"}`;
    const storedFilePath = path.resolve(profileUploadsDir, storedFileName);
    fs.writeFileSync(storedFilePath, file.buffer);
    const cvUrl = `/uploads/profile/${storedFileName}`;

    // 1. Analizar el PDF con el proveedor de IA configurado
    console.log("Analizando CV con proveedor de IA...");
    const aiProfile = await aiService.extractProfileFromCV(file.buffer, file.mimetype);
    console.log("Perfil generado por IA:", aiProfile);

    // 3. Actualizar la base de datos del usuario
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Obtenemos los datos actuales y los fusionamos con los nuevos de la IA
    const currentProfileData = user.profileData && typeof user.profileData === 'object' 
      ? user.profileData 
      : {};

    const updatedProfileData = {
      ...currentProfileData,
      aiProfile,
      cvUrl,
      cvFileName: file.originalname,
      cvUploadedAt: new Date().toISOString(),
    };

    // Actualizamos el usuario
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        profileData: updatedProfileData,
        headline: user.headline || aiProfile.headline,
        bio: user.bio || aiProfile.bio,
      }
    });

    res.status(200).json({
      message: "CV procesado exitosamente con IA",
      aiAnalysis: aiProfile,
      cvUrl,
    });

  } catch (error: any) {
    console.error("[Upload CV Error]", error);
    res.status(500).json({ error: "Error interno procesando el CV", details: error.message });
  }
});

export default router;
