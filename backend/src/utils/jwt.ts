import jwt from "jsonwebtoken";

export interface TokenPayload {
  userId: string;
  role: string;
  email: string;
}

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-change-in-production";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "fallback-refresh-secret-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

export const generateTokens = (userId: string, role: string, email: string) => {
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

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
};

export const verifyRefreshToken = (token: string): { userId: string } => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: string };
};
