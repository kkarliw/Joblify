import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Home, Briefcase, Users, KanbanSquare, MessageSquare, User, Settings, Plus,
  Sparkles, LogOut, Building2, Wallet, FolderKanban, Star, FileText, Newspaper,
  Rocket, GraduationCap, Lightbulb, Handshake, BookOpen, LayoutDashboard, UserCircle, Bookmark
} from "lucide-react";
import { cn } from "@/lib/utils";
import { roleLabel, roleToSlug, type UserRole, useAuthStore } from "@/store/authStore";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type Session = {
  email: string;
  name: string;
  role: UserRole;
};

type Item = { label: string; icon: typeof Home; to: string };

const buildNav = (role: UserRole): { primary: Item[]; cta?: { label: string; to: string; icon: typeof Plus } } => {
  const base = `/app/${roleToSlug(role)}`;
  if (role === "candidato") {
    const talentLinks = [
      { to: "/app/talento", icon: Home, label: "Inicio" },
      { to: "/app/talento/panel", icon: LayoutDashboard, label: "Mi Panel" },
      { to: "/app/talento/vacantes", icon: Briefcase, label: "Vacantes" },
      { to: "/app/talento/aplicaciones", icon: FileText, label: "Aplicaciones" },
      { to: "/app/talento/guardados", icon: Bookmark, label: "Guardados" },
      { to: "/app/talento/mensajes", icon: MessageSquare, label: "Mensajes" },
      { to: "/app/talento/perfil", icon: UserCircle, label: "Mi perfil" },
    ];
    return {
      primary: talentLinks,
    };
  }
  if (role === "empresa") {
    return {
      primary: [
        { label: "Inicio", icon: Home, to: base },
        { label: "Feed social", icon: Newspaper, to: `${base}/feed` },
        { label: "Vacantes", icon: Briefcase, to: `${base}/vacantes` },
        { label: "Candidatos", icon: Users, to: `${base}/candidatos` },
        { label: "Pipeline", icon: KanbanSquare, to: `${base}/pipeline` },
        { label: "Mensajes", icon: MessageSquare, to: `${base}/mensajes` },
      ],
      cta: { label: "Publicar vacante", to: `${base}/publicar`, icon: Plus },
    };
  }
  if (role === "freelancer") {
    return {
      primary: [
        { label: "Inicio", icon: Home, to: base },
        { label: "Feed social", icon: Newspaper, to: `${base}/feed` },
        { label: "Proyectos", icon: FolderKanban, to: `${base}/proyectos` },
        { label: "Propuestas", icon: FileText, to: `${base}/propuestas` },
        { label: "Mi perfil", icon: Star, to: `${base}/perfil` },
        { label: "Mensajes", icon: MessageSquare, to: `${base}/mensajes` },
      ],
    };
  }
  if (role === "emprendedor") {
    return {
      primary: [
        { label: "Inicio", icon: Home, to: base },
        { label: "Feed social", icon: Newspaper, to: `${base}/feed` },
        { label: "Mis proyectos", icon: Rocket, to: `${base}/proyectos` },
        { label: "Cofundadores", icon: Handshake, to: `${base}/cofounders` },
        { label: "Postulantes", icon: Users, to: `${base}/postulantes` },
        { label: "Mensajes", icon: MessageSquare, to: `${base}/mensajes` },
      ],
      cta: { label: "Publicar startup", to: `${base}/publicar`, icon: Lightbulb },
    };
  }
  // estudiante
  return {
    primary: [
      { label: "Inicio", icon: Home, to: base },
      { label: "Feed social", icon: Newspaper, to: `${base}/feed` },
      { label: "Prácticas", icon: GraduationCap, to: `${base}/practicas` },
      { label: "Recursos", icon: BookOpen, to: `${base}/recursos` },
      { label: "Aplicaciones", icon: FileText, to: `${base}/aplicaciones` },
      { label: "Mensajes", icon: MessageSquare, to: `${base}/mensajes` },
    ],
  };
};

const roleIcon = (r: UserRole) =>
  r === "empresa" ? Building2
  : r === "freelancer" ? Sparkles
  : r === "emprendedor" ? Rocket
  : r === "estudiante" ? GraduationCap
  : Briefcase;

export const RoleSidebar = ({ session }: { session: Session }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const logout = useAuthStore((state) => state.logout);
  const conf = buildNav(session.role);
  const RoleIcon = roleIcon(session.role);
  const base = `/app/${roleToSlug(session.role)}`;

  const handleLogout = async () => {
    await logout();
    queryClient.clear();
    localStorage.removeItem("joblify.session");
    toast.success("Sesión cerrada");
    navigate("/login", { replace: true });
  };

  return (
    <aside className="hidden lg:flex w-64 shrink-0 border-r border-border bg-surface-elevated/60 flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-foreground text-background flex items-center justify-center">
            <RoleIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Panel</p>
            <p className="text-sm font-subtitle font-semibold text-foreground truncate">{roleLabel[session.role]}</p>
          </div>
        </div>
      </div>

      {conf.cta && (
        <div className="p-4">
          <NavLink
            to={conf.cta.to}
            className="flex items-center justify-center gap-2 h-10 rounded-full bg-primary text-primary-foreground hover:bg-primary-hover text-sm font-semibold transition-colors"
          >
            <conf.cta.icon className="h-4 w-4" />
            {conf.cta.label}
          </NavLink>
        </div>
      )}

      <nav className={cn("px-3 flex-1 space-y-0.5", !conf.cta && "pt-4")}>
        {conf.primary.map(({ label, icon: Icon, to }) => {
          const active = to === base ? pathname === to : pathname === to || pathname.startsWith(to + "/");
          return (
            <NavLink
              key={to}
              to={to}
              end={to === base}
              className={cn(
                "flex items-center gap-3 h-10 px-3 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-card"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          );
        })}

        <div className="h-px bg-border my-4" />

        <NavLink
          to={`${base}/configuracion`}
          className={({ isActive }) => cn(
            "flex items-center gap-3 h-10 px-3 rounded-lg text-sm font-medium transition-colors",
            isActive ? "bg-card text-foreground border border-border" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Settings className="h-4 w-4" />
          Configuración
        </NavLink>

        <button
          onClick={() => void handleLogout()}
          className="w-full flex items-center gap-3 h-10 px-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </nav>

      <div className="p-3 m-3 mt-auto rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-foreground text-background text-xs flex items-center justify-center font-semibold">
            {session.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-subtitle font-semibold truncate">{session.name}</p>
            <p className="text-[10px] text-muted-foreground truncate">{session.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
