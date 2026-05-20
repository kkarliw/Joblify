// Mock auth. Stores a fake session in localStorage.
export type AuthRole = "candidato" | "empresa" | "freelancer" | "emprendedor" | "estudiante";
export type RoleSlug = "talento" | "empresa" | "freelancer" | "startup" | "estudiante";

const KEY = "joblify.session";

export type Session = {
  email: string;
  name: string;
  role: AuthRole;
};

export const roleToSlug = (r: AuthRole): RoleSlug => {
  switch (r) {
    case "candidato": return "talento";
    case "emprendedor": return "startup";
    default: return r as RoleSlug;
  }
};

export const slugToRole = (s: string): AuthRole | null => {
  if (s === "talento") return "candidato";
  if (s === "startup") return "emprendedor";
  if (s === "empresa" || s === "freelancer" || s === "estudiante") return s;
  return null;
};

export const roleLabel: Record<AuthRole, string> = {
  candidato: "Talento",
  empresa: "Empresa",
  freelancer: "Freelancer",
  emprendedor: "Emprendedor",
  estudiante: "Estudiante",
};

export const signIn = (email: string, role: AuthRole): Session => {
  const name = email.split("@")[0] || "Usuario";
  const session: Session = { email, name, role };
  localStorage.setItem(KEY, JSON.stringify(session));
  return session;
};

export const signOut = () => localStorage.removeItem(KEY);

export const getSession = (): Session | null => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
};

export const homeForRole = (r: AuthRole) => `/app/${roleToSlug(r.toLowerCase() as AuthRole)}`;
