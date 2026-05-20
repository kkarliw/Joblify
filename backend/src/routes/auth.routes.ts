import { Router, Request, Response, type RequestHandler } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, type AuthRequest } from "../middleware/auth.middleware";
import { emailService } from "../services/email.service";
import crypto from "crypto";
import { Role, Prisma } from "@prisma/client"; // Importar el enum de Prisma
import { isAllowedInitialLocation, normalizeLocation } from "../constants/colombia-locations";

const validRoles = ["candidato", "empresa", "freelancer", "emprendedor", "estudiante", "mentor"] as const;
type RoleValue = typeof validRoles[number];

const router = Router();
const authMiddleware = authenticate as unknown as RequestHandler;

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

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-change-in-production";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "fallback-refresh-secret-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
const VERIFICATION_CODE_TTL_MINUTES = Number(process.env.VERIFICATION_CODE_TTL_MINUTES || 15);
const VERIFICATION_RESEND_COOLDOWN_SECONDS = Number(process.env.VERIFICATION_RESEND_COOLDOWN_SECONDS || 60);
const VERIFICATION_MAX_ATTEMPTS = Number(process.env.VERIFICATION_MAX_ATTEMPTS || 5);
const VERIFICATION_LOCK_MINUTES = Number(process.env.VERIFICATION_LOCK_MINUTES || 15);
const UNVERIFIED_ACCOUNT_TTL_HOURS = Number(process.env.UNVERIFIED_ACCOUNT_TTL_HOURS || 72);

const toProfileDataObject = (value: unknown): Record<string, unknown> => {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
};

const generateVerificationCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const buildVerificationMetadata = (base: Record<string, unknown>, code: string) => ({
  ...base,
  verificationCode: code,
  verificationCodeExpiresAt: new Date(Date.now() + VERIFICATION_CODE_TTL_MINUTES * 60 * 1000).toISOString(),
  verificationAttempts: 0,
  verificationLockedUntil: null,
  verificationLastSentAt: new Date().toISOString(),
  verificationResendAvailableAt: new Date(Date.now() + VERIFICATION_RESEND_COOLDOWN_SECONDS * 1000).toISOString(),
});

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

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    console.log("[DEBUG] Register - Role received:", data.role);

    if (data.location && !isAllowedInitialLocation(data.location)) {
      return res.status(400).json({ error: "Por ahora solo aceptamos ubicaciones de Colombia, Remote / Remoto u Otra." });
    }

    let exists = await prisma.user.findUnique({ where: { email: data.email } });

    const staleCutoff = new Date(Date.now() - UNVERIFIED_ACCOUNT_TTL_HOURS * 60 * 60 * 1000);
    if (exists && !exists.isVerified && exists.createdAt < staleCutoff) {
      await prisma.user.delete({ where: { id: exists.id } });
      exists = null;
    }

    if (exists && exists.isVerified) {
      return res.status(409).json({ error: "Este correo ya está registrado. Intenta iniciar sesión o usa otro correo." });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const verificationCode = generateVerificationCode();

    // Encontrar el rol correcto usando el objeto Role de Prisma
    const roleKey = Object.keys(Role).find(k => k.toLowerCase() === data.role.toLowerCase());
    const finalRole = roleKey ? Role[roleKey as keyof typeof Role] : data.role;

    const mergedProfileData = buildVerificationMetadata(
      {
        ...toProfileDataObject(exists?.profileData),
        ...(data.profileData ?? {}),
      },
      verificationCode
    );

    const user = exists
      ? await prisma.user.update({
          where: { id: exists.id },
          data: {
            passwordHash,
            name: data.name,
            role: finalRole as Role,
            headline: data.headline || null,
            location: data.location ? normalizeLocation(data.location) : null,
            profileCompletion: 25,
            profileData: mergedProfileData as Prisma.InputJsonValue,
            isVerified: false,
            isActive: true,
            plan: "FREE",
          },
        })
      : await prisma.user.create({
          data: {
            email: data.email,
            passwordHash,
            name: data.name,
            role: finalRole as Role,
            headline: data.headline || null,
            location: data.location ? normalizeLocation(data.location) : null,
            profileCompletion: 25,
            profileData: mergedProfileData as Prisma.InputJsonValue,
            isVerified: false,
            isActive: true,
            plan: "FREE",
          },
        });

    emailService.sendVerificationCodeEmail(user.email, verificationCode, user.name).catch(err => {
      console.error("Error enviando email de verificacion:", err);
      if (process.env.NODE_ENV !== "production") {
        console.log(`[DEV] Código de verificación para ${user.email}: ${verificationCode}`);
      }
    });

    console.log("Código generado (también enviado por correo):", verificationCode);

    res.status(exists ? 200 : 201).json({
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

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) return res.status(401).json({ error: "Correo no registrado. Verifica tu correo o regístrate." });
    if (!user.isActive) return res.status(401).json({ error: "Tu cuenta ha sido desactivada. Contacta soporte." });
    
    if (!user.isVerified) {
      return res.status(403).json({
        error: "Debes verificar tu email antes de iniciar sesión.",
        needsVerification: true,
        email: user.email,
      });
    }

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

// POST /api/auth/refresh
router.post("/refresh", async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: "Refresh token requerido" });

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { userId: string };

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.expiresAt < new Date()) {
      return res.status(401).json({ error: "Refresh token inválido o expirado" });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, isActive: true },
    });
    if (!user || !user.isActive) return res.status(401).json({ error: "Usuario no encontrado" });

    const tokens = generateTokens(user.id, user.role, user.email);

    await prisma.refreshToken.delete({ where: { token: refreshToken } });
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json(tokens);
  } catch {
    res.status(401).json({ error: "Refresh token inválido" });
  }
});

// POST /api/auth/logout
router.post("/logout", authMiddleware, async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }
  res.json({ message: "Sesión cerrada" });
});

// GET /api/auth/me
router.get("/me", authMiddleware, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const user = await prisma.user.findUnique({
    where: { id: authReq.user!.id },
    select: {
      id: true, email: true, name: true, role: true, avatarUrl: true, coverUrl: true,
      headline: true, bio: true, location: true, phone: true, website: true,
      linkedinUrl: true, isVerified: true, plan: true, profileCompletion: true,
      matchScore: true, createdAt: true,
    },
  });
  res.json(user);
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email requerido" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if user exists
      return res.json({ message: "Si el email existe, recibiras instrucciones" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Guardar los datos de recuperación en profileData para no depender de columnas extras en DB
    const updatedProfileData = user.profileData ? 
      (typeof user.profileData === 'string' ? JSON.parse(user.profileData) : user.profileData) : {};
    
    updatedProfileData.resetPasswordToken = resetToken;
    updatedProfileData.resetPasswordExpires = resetExpires.toISOString();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        profileData: updatedProfileData as Prisma.InputJsonValue,
      },
    });

    // Send email
    emailService.sendPasswordResetEmail(email, user.name, resetToken).catch(err => {
      console.error("Error enviando email de reset:", err);
    });

    res.json({ message: "Si el email existe, recibiras instrucciones" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al procesar solicitud" });
  }
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: "Token y contraseña requeridos" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });
    }

    const users = await prisma.user.findMany({});
    
    // Buscar manualmente al usuario que tenga el token en su profileData
    let user = null;
    for (const u of users) {
      if (u.profileData) {
        const pd = typeof u.profileData === 'string' ? JSON.parse(u.profileData) : u.profileData;
        if (pd.resetPasswordToken === token && new Date(pd.resetPasswordExpires) > new Date()) {
          user = u;
          break;
        }
      }
    }

    if (!user) {
      return res.status(400).json({ error: "Token invalido o expirado" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    
    // Limpiar token
    const pd = typeof user.profileData === 'string' ? JSON.parse(user.profileData) : user.profileData;
    delete pd.resetPasswordToken;
    delete pd.resetPasswordExpires;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        profileData: pd,
      },
    });

    res.json({ message: "Contraseña actualizada correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al restablecer contraseña" });
  }
});

// POST /api/auth/resend-verification - Reenviar código de verificación
router.post("/resend-verification", async (req: Request, res: Response) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email) {
      return res.status(400).json({ error: "Email requerido" });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.json({ message: "Si el correo existe, te enviamos un nuevo código." });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: "Este correo ya está verificado. Inicia sesión." });
    }

    const profileData = toProfileDataObject(user.profileData);
    const resendAvailableAtRaw = typeof profileData.verificationResendAvailableAt === "string"
      ? profileData.verificationResendAvailableAt
      : "";
    const resendAvailableAt = resendAvailableAtRaw ? new Date(resendAvailableAtRaw) : null;

    if (resendAvailableAt && !Number.isNaN(resendAvailableAt.getTime()) && resendAvailableAt > new Date()) {
      const remainingSeconds = Math.ceil((resendAvailableAt.getTime() - Date.now()) / 1000);
      return res.status(429).json({
        error: `Espera ${remainingSeconds}s para reenviar otro código.`,
        retryAfterSeconds: remainingSeconds,
      });
    }

    const verificationCode = generateVerificationCode();
    const updatedProfileData = buildVerificationMetadata(profileData, verificationCode);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        profileData: updatedProfileData as Prisma.InputJsonValue,
      },
    });

    emailService.sendVerificationCodeEmail(user.email, verificationCode, user.name).catch(err => {
      console.error("Error reenviando email de verificacion:", err);
      if (process.env.NODE_ENV !== "production") {
        console.log(`[DEV] Código de verificación para ${user.email}: ${verificationCode}`);
      }
    });

    return res.json({ message: "Te enviamos un nuevo código de verificación." });
  } catch (error) {
    console.error("[Resend Verification Error]", error);
    return res.status(500).json({ error: "No se pudo reenviar el código" });
  }
});

// POST /api/auth/verify-email - Verificar codigo de 6 digitos
router.post("/verify-email", async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: "Email y código requeridos" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: "Este correo ya fue verificado. Inicia sesión." });
    }

    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: "Código inválido. Debe ser 6 dígitos." });
    }

    const profileData = toProfileDataObject(user.profileData);
    const storedCode = typeof profileData.verificationCode === "string" ? profileData.verificationCode : "";
    const expiresAtRaw = typeof profileData.verificationCodeExpiresAt === "string"
      ? profileData.verificationCodeExpiresAt
      : "";
    const attempts = typeof profileData.verificationAttempts === "number" ? profileData.verificationAttempts : 0;
    const lockedUntilRaw = typeof profileData.verificationLockedUntil === "string"
      ? profileData.verificationLockedUntil
      : "";
    const lockedUntil = lockedUntilRaw ? new Date(lockedUntilRaw) : null;
    const expiresAt = expiresAtRaw ? new Date(expiresAtRaw) : null;

    if (lockedUntil && !Number.isNaN(lockedUntil.getTime()) && lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
      return res.status(429).json({ error: `Demasiados intentos. Intenta nuevamente en ${remainingMinutes} minuto(s).` });
    }

    if (!storedCode || storedCode !== code) {
      const nextAttempts = attempts + 1;
      const lockNow = nextAttempts >= VERIFICATION_MAX_ATTEMPTS;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          profileData: {
            ...profileData,
            verificationAttempts: lockNow ? 0 : nextAttempts,
            verificationLockedUntil: lockNow
              ? new Date(Date.now() + VERIFICATION_LOCK_MINUTES * 60 * 1000).toISOString()
              : null,
          } as Prisma.InputJsonValue,
        },
      });

      if (lockNow) {
        return res.status(429).json({ error: `Demasiados intentos. Intenta nuevamente en ${VERIFICATION_LOCK_MINUTES} minuto(s).` });
      }
      return res.status(400).json({ error: "Código incorrecto. Intenta nuevamente." });
    }

    if (!expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt < new Date()) {
      return res.status(400).json({ error: "El código expiró. Solicita uno nuevo." });
    }

    delete profileData.verificationCode;
    delete profileData.verificationCodeExpiresAt;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        profileData: profileData as Prisma.InputJsonValue,
      },
    });

    const JWT_SECRET = process.env.JWT_SECRET || "joblify_secreto_2026_muy_largo_y_seguro_karla";
    const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "joblify_refresh_diferente_2026_karla";
    
    const accessToken = jwt.sign({ userId: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: "24h" });
    const refreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, { expiresIn: "7d" });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Enviar estructura completa para que el Frontend la pueda leer (especialmente user.role)
    res.json({
      message: "Email verificado correctamente",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: true,
        avatarUrl: user.avatarUrl,
        coverUrl: user.coverUrl,
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    res.status(500).json({ error: "Error al verificar email" });
  }
});

// GET /api/auth/me
router.get("/me", authMiddleware, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  try {
    const user = await prisma.user.findUnique({
      where: { id: authReq.user!.id },
      select: {
        id: true, email: true, name: true, role: true, avatarUrl: true, coverUrl: true,
        headline: true, bio: true, location: true, phone: true, website: true,
        linkedinUrl: true, isVerified: true, plan: true, profileCompletion: true,
        matchScore: true, createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener datos del usuario" });
  }
});

// Google OAuth endpoints
// GET /api/auth/google - Redirect to Google
router.get("/google", (req, res) => {
  // Import passport dynamically to avoid issues if not configured
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

      // Save refresh token
      prisma.refreshToken.create({
        data: {
          token: tokens.refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }).catch(console.error);

      // Redirect with tokens
      res.redirect(
        `${frontendUrl}/auth/callback?token=${tokens.accessToken}&refresh=${tokens.refreshToken}&role=${user.role}`
      );
    })(req, res, next);
  });
});

export default router;
