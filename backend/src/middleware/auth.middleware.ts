import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";

export type AuthRequest = Request;

export const authenticate: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token requerido" });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string; email: string };
    req.user = { id: payload.userId, role: payload.role, email: payload.email };
    next();
  } catch {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
};

export const requireRole = (...roles: string[]) =>
  ((req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "No tienes permiso para esta acción" });
      return;
    }
    next();
  }) as RequestHandler;
