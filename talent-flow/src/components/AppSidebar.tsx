import { Link, useLocation } from "react-router-dom";
import {
  Home, Briefcase, Users, KanbanSquare, MessageSquare, User, Settings, Plus, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { label: "Feed", icon: Home, to: "/feed" },
  { label: "Vacantes", icon: Briefcase, to: "/vacantes" },
  { label: "Candidatos", icon: Users, to: "/candidatos" },
  { label: "Pipeline", icon: KanbanSquare, to: "/pipeline" },
  { label: "Mensajes", icon: MessageSquare, to: "/chat" },
  { label: "Mi perfil", icon: User, to: "/perfil" },
];

const secondary = [
  { label: "Configuración", icon: Settings, to: "/configuracion" },
];

export const AppSidebar = () => {
  const { pathname } = useLocation();
  return (
    <aside className="hidden lg:flex w-60 shrink-0 border-r border-border bg-surface-elevated/60 flex-col">
      <div className="p-4">
        <Link
          to="/publicar"
          className="flex items-center justify-center gap-2 h-10 rounded-full bg-primary text-primary-foreground hover:bg-primary-hover text-sm font-semibold transition-colors"
        >
          <Plus className="h-4 w-4" />
          Publicar vacante
        </Link>
      </div>

      <nav className="px-3 flex-1 space-y-0.5">
        {items.map(({ label, icon: Icon, to }) => {
          const active = pathname === to || (to !== "/feed" && pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 h-10 px-3 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-card"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}

        <div className="h-px bg-border my-4" />

        {secondary.map(({ label, icon: Icon, to }) => {
          const active = pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 h-10 px-3 rounded-lg text-sm font-medium transition-colors",
                active ? "bg-card text-foreground border border-border" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 m-3 mt-auto rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Joblify Pro
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
          Desbloquea match IA premium y boost de visibilidad.
        </p>
        <button className="mt-3 text-xs font-semibold underline underline-offset-4">
          Ver planes →
        </button>
      </div>
    </aside>
  );
};
