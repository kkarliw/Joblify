import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import passport from "passport";
import fs from "fs";
import path from "path";

// Import passport config to register Google strategy
import "./config/passport";

import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import profileRoutes from "./routes/profile.routes";
import jobRoutes from "./routes/job.routes";
import applicationRoutes from "./routes/application.routes";
import freelanceRoutes from "./routes/freelance.routes";
import startupRoutes from "./routes/startup.routes";
import messageRoutes from "./routes/message.routes";
import feedRoutes from "./routes/feed.routes";
import aiRoutes from "./routes/ai.routes";
import notificationRoutes from "./routes/notification.routes";
import savedRoutes from "./routes/saved.routes";
import companyRoutes from "./routes/company.routes";

const app = express();
const PORT = process.env.PORT || 4000;
const uploadsDir = path.resolve(process.cwd(), "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ─── Seguridad ───────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:8080",
  credentials: true,
}));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,
  message: { error: "Demasiadas peticiones, intenta en 15 minutos." },
}));

// ─── Parsers ─────────────────────────────────────────────────────────
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(morgan("dev"));
app.use("/uploads", express.static(uploadsDir));

// ─── Passport (Google OAuth) ─────────────────────────────────────────
app.use(passport.initialize());

// ─── Health check ────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), service: "joblify-api" });
});

// ─── Rutas ───────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/freelance", freelanceRoutes);
app.use("/api/startups", startupRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/saved", savedRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/notifications", notificationRoutes);

// ─── 404 ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// ─── Error handler global ─────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Error interno del servidor", message: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 Joblify API corriendo en http://localhost:${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV}`);
});

export default app;
