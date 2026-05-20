import type { AuthUser } from "@/store/authStore";

export const hasRealSession = (
  user: AuthUser | null | undefined,
  token: string | null | undefined,
  refreshToken: string | null | undefined
) => {
  return Boolean(
    user &&
      typeof user.id === "string" &&
      user.id.trim().length > 0 &&
      typeof user.email === "string" &&
      user.email.trim().length > 0 &&
      typeof user.name === "string" &&
      user.name.trim().length > 0 &&
      typeof user.role === "string" &&
      user.role.trim().length > 0 &&
      typeof token === "string" &&
      token.trim().length > 0 &&
      typeof refreshToken === "string" &&
      refreshToken.trim().length > 0
  );
};
