import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, type AuthRequest } from "../middleware/auth.middleware";
import { emailService } from "../services/email.service";
import crypto from "crypto";

const router = Router();

// ─── SCHEMAS ─────────────────────────────────────────────────────────────
const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  name: z.string().min(2, "Nombre muy corto"),
  role: z.string().transform(r => r.toLowerCase()).refine(
    r => ["candidato", "empresa", "freelancer", "emprendedor", "estudiante", "mentor"].includes(r),
    { message: "Rol inválido" }
  ),
  headline: z.string().optional(),
  location: z.string().optional(),
  profileData: z.object({
    experienceYears: z.number().optional(),
    availability: z.string().optional(),
    expectedSalary: z.number().optional(),
    modalityPref: z.string().optional(),
    companyName: z.string().optional(),
    industry: z.string().optional(),
    companySize: z.string().optional(),
    hourlyRate: z.number().optional(),
    services: z.array(z.any()).optional(),
    bio: z.string().optional(),
    industries: z.array(z.string()).optional(),
    projectName: z.string().optional(),
    institution: z.string().optional(),
    career: z.string().optional(),
    semester: z.number().optional(),
    internshipType: z.string().optional(),
    weeklyHours: z.number().optional(),
  }).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ─── JWT CONFIG ──────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-change-in-production";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "fallback-refresh-secret-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

const generateTokens = (userId: string, role: string, email: string) => {
  const accessToken = jwt.sign(
    { userId, role, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN as any }
  );
  const refreshToken = jwt.sign(
    { userId },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN as any }
  );
  return { accessToken, refreshToken };
};

// ─── RUTAS DE AUTENTICACIÓN ──────────────────────────────────────────────

// POST /api/auth/register - Registrar usuario
router.post("/register", async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    console.log("[DEBUG] Register - Role received:", data.role);

    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) return res.status(409).json({ error: "Este correo ya está registrado. Intenta iniciar sesión o usa otro correo." });

    const passwordHash = await bcrypt.hash(data.password, 12);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        role: data.role as any,
        headline: data.headline || null,
        location: data.location || null,
        profileCompletion: 25,
        profileData: data.profileData as any,
        verificationToken: verificationCode,
        isVerified: false,
        isActive: true,
        plan: "FREE",
      },
    });

    emailService.sendVerificationCodeEmail(user.email, verificationCode, user.name).catch(err => {
      console.error("Error enviando email de verificacion:", err);
    });

    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      message: "Registro exitoso. Revisa tu email para el codigo de verificacion."
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const msg = err.errors[0].message;
      if (msg.includes("email")) return res.status(400).json({ error: "Ingresa un correo electrónico válido" });
      if (msg.includes("password")) return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });
      if (msg.includes("name")) return res.status(400).json({ error: "Ingresa tu nombre completo" });
      return res.status(400).json({ error: "Completa todos los campos correctamente" });
    }
    console.error("[Register Error]", err);
    res.status(500).json({ error: "Error al registrarte. Intenta más tarde." });
  }
});

// POST /api/auth/login - Iniciar sesión
router.post("/login", async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) return res.status(401).json({ error: "Correo no registrado. Verifica tu correo o regístrate." });
    if (!user.isActive) return res.status(401).json({ error: "Tu cuenta ha sido desactivada. Contacta soporte." });
    if (!user.emailVerified) return res.status(403).json({ error: "Debes verificar tu email antes de iniciar sesion. Revisa tu bandeja de entrada.", needsVerification: true, email: user.email });

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Contraseña incorrecta. Intenta de nuevo." });

    const { accessToken, refreshToken } = generateTokens(user.id, user.role, user.email);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      user: {
        id: user.id, email: user.email, name: user.name, role: user.role,
        avatarUrl: user.avatarUrl, profileCompletion: user.profileCompletion, plan: user.plan,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const msg = err.errors[0].message;
      if (msg.includes("email")) return res.status(400).json({ error: "Ingresa un correo válido" });
      if (msg.includes("password")) return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });
      return res.status(400).json({ error: "Completa todos los campos correctamente" });
    }
    console.error("[Login Error]", err);
    res.status(500).json({ error: "Error al iniciar sesión. Intenta más tarde." });
  }
});

// POST /api/auth/verify-email - Verificar email con código de 6 dígitos
router.post("/verify-email", async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: "Email y codigo requeridos" });
    }

    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: "Codigo invalido. Debe ser 6 digitos numericos" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (user.verificationToken !== code) {
      return res.status(400).json({ error: "Codigo de verificacion incorrecto" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        isVerified: true,
        verificationToken: null,
      },
    });

    const { accessToken, refreshToken } = generateTokens(user.id, user.role, user.email);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      message: "Email verificado correctamente",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: true,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error("[Verify Email Error]", err);
    res.status(500).json({ error: "Error al verificar email" });
  }
});

// POST /api/auth/resend-verification - Reenviar código de verificación
router.post("/resend-verification", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email requerido" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: "El email ya esta verificado" });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: verificationCode,
      },
    });

    emailService.sendVerificationCodeEmail(user.email, verificationCode, user.name).catch(err => {
      console.error("Error reenviando email de verificacion:", err);
    });

    res.json({ message: "Codigo de verificacion reenviado. Revisa tu email." });
  } catch (err) {
    console.error("[Resend Verification Error]", err);
    res.status(500).json({ error: "Error al reenviar codigo" });
  }
});

// POST /api/auth/forgot-password - Solicitar reset de contraseña
router.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email requerido" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.json({ message: "Si el email existe, recibiras instrucciones" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      },
    });

    emailService.sendPasswordResetEmail(email, user.name, resetToken).catch(err => {
      console.error("Error enviando email de reset:", err);
    });

    res.json({ message: "Si el email existe, recibiras instrucciones" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al procesar solicitud" });
  }
});

// POST /api/auth/reset-password - Restablecer contraseña
router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: "Token y contraseña requeridos" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });
    }

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ error: "Token inválido o expirado" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    res.json({ message: "Contraseña restablecida correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al restablecer contraseña" });
  }
});

// POST /api/auth/refresh - Renovar token
router.post("/refresh", async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: "Refresh token requerido" });

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any;
    const storedToken = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      return res.status(401).json({ error: "Refresh token inválido o expirado" });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return res.status(401).json({ error: "Usuario no encontrado" });

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id, user.role, user.email);

    await prisma.refreshToken.delete({ where: { token: refreshToken } });
    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    res.status(401).json({ error: "Refresh token inválido" });
  }
});

// POST /api/auth/logout - Cerrar sesión
router.post("/logout", authenticate, async (req: AuthRequest, res: Response) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }
  res.json({ message: "Sesión cerrada" });
});

// GET /api/auth/me - Obtener datos del usuario autenticado
router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true, email: true, name: true, role: true, avatarUrl: true, coverUrl: true,
      headline: true, bio: true, location: true, phone: true, website: true,
      linkedinUrl: true, isVerified: true, plan: true, profileCompletion: true,
      matchScore: true, createdAt: true,
    },
  });
  res.json(user);
});

// ─── GOOGLE OAUTH ─────────────────────────────────────────────────────────

// GET /api/auth/google - Redirect to Google
router.get("/google", (req, res) => {
  import("../config/passport").then(({ default: passport }) => {
    passport.authenticate("google", {
      scope: ["profile", "email"],
    })(req, res);
  });
});

// GET /api/auth/google/callback - Google callback
router.get("/google/callback", (req, res, next) => {
  import("../config/passport").then(({ default: passport }) => {
    passport.authenticate("google", { session: false }, (err: any, data: any) => {
      if (err) {
        console.error("[Google OAuth] Error:", err);
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";
        return res.redirect(`${frontendUrl}/login?error=google_auth_failed&message=${encodeURIComponent(err.message)}`);
      }
      if (!data) {
        console.error("[Google OAuth] No data returned");
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";
        return res.redirect(`${frontendUrl}/login?error=google_auth_failed&message=no_data`);
      }

      const { user, tokens } = data;
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";

      prisma.refreshToken.create({
        data: {
          token: tokens.refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }).catch(console.error);

      res.redirect(
        `${frontendUrl}/auth/callback?token=${tokens.accessToken}&refresh=${tokens.refreshToken}&role=${user.role}`
      );
    })(req, res, next);
  });
});

export default router;
