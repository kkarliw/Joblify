import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi } from "@/lib/api";

export type UserRole = "candidato" | "empresa" | "freelancer" | "emprendedor" | "estudiante";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  coverUrl?: string;
  headline?: string;
  bio?: string;
  location?: string;
  profileCompletion: number;
  plan?: string;
  isVerified?: boolean;
  profileData?: unknown;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  onboardingDone: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    role: string;
    headline?: string;
    location?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  setUser: (user: Partial<AuthUser>) => void;
  setOnboardingDone: (done: boolean) => void;
  clearError: () => void;
}

export const roleToSlug = (role: string): string => {
  const r = role.toLowerCase();
  switch (r) {
    case "candidato": return "talento";
    case "emprendedor": return "startup";
    case "empresa": return "empresa";
    case "freelancer": return "freelancer";
    case "estudiante": return "estudiante";
    default: return "talento";
  }
};

export const slugToRole = (slug: string): UserRole | null => {
  const value = slug.toLowerCase();
  if (value === "talento") return "candidato";
  if (value === "startup") return "emprendedor";
  if (value === "empresa" || value === "freelancer" || value === "estudiante") {
    return value;
  }
  return null;
};

export const roleLabel: Record<UserRole, string> = {
  candidato: "Talento",
  empresa: "Empresa",
  freelancer: "Freelancer",
  emprendedor: "Emprendedor",
  estudiante: "Estudiante",
};

export const homeForRole = (role: UserRole) => `/app/${roleToSlug(role.toLowerCase() as UserRole)}`;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,
      error: null,
      onboardingDone: false,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await authApi.login({ email, password });
          localStorage.setItem("joblify.token", data.accessToken);
          localStorage.setItem("joblify.refresh", data.refreshToken);
          set({
            user: data.user,
            token: data.accessToken,
            refreshToken: data.refreshToken,
            isLoading: false,
          });
        } catch (err: unknown) {
          const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Error al iniciar sesión";
          set({ isLoading: false, error: msg });
          throw new Error(msg);
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const { data: res } = await authApi.register(data);
          localStorage.setItem("joblify.token", res.accessToken);
          localStorage.setItem("joblify.refresh", res.refreshToken);
          set({
            user: res.user,
            token: res.accessToken,
            refreshToken: res.refreshToken,
            isLoading: false,
            onboardingDone: false,
          });
        } catch (err: unknown) {
          const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Error al registrarse";
          set({ isLoading: false, error: msg });
          throw new Error(msg);
        }
      },

      logout: async () => {
        const { refreshToken } = get();
        if (refreshToken) {
          try { await authApi.logout(refreshToken); } catch { /* silencioso */ }
        }
        localStorage.removeItem("joblify.token");
        localStorage.removeItem("joblify.refresh");
        localStorage.removeItem("joblify.user");
        localStorage.removeItem("joblify.auth");
        localStorage.removeItem("joblify.session");
        set({
          user: null,
          token: null,
          refreshToken: null,
          onboardingDone: false,
          isLoading: false,
          error: null,
        });
      },

      fetchMe: async () => {
        set({ isLoading: true });
        try {
          const { data } = await authApi.me();
          set({ user: { ...data, role: data.role.toLowerCase() as UserRole } });
        } catch {
          get().logout();
        }
      },

      setUser: (user) => {
        set((state) => {
          const updatedUser = { ...state.user, ...user };
          if (updatedUser.role) {
            updatedUser.role = updatedUser.role.toLowerCase() as UserRole;
          }
          return { user: updatedUser as AuthUser };
        });
      },

      setOnboardingDone: (done) => set({ onboardingDone: done }),

      clearError: () => set({ error: null }),
    }),
    {
      name: "joblify.auth",
      partialize: (state) => ({
        user: state.user
          ? {
              id: state.user.id,
              email: state.user.email,
              name: state.user.name,
              role: state.user.role,
              headline: state.user.headline,
              location: state.user.location,
              profileCompletion: state.user.profileCompletion,
              plan: state.user.plan,
              isVerified: state.user.isVerified,
            }
          : null,
        token: state.token,
        refreshToken: state.refreshToken,
        onboardingDone: state.onboardingDone,
      }),
    }
  )
);
