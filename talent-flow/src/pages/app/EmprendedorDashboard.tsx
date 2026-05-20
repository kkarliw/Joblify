import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Rocket, Users, MessageSquare, TrendingUp, Lightbulb, ArrowRight, Handshake, ClipboardList, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useAuthStore } from "@/store/authStore";
import { startupApi } from "@/lib/api";
import { AIRecommendations } from "@/components/AIRecommendations";

type StartupOwned = {
  id: string;
  name: string;
  tagline?: string | null;
  description?: string | null;
  stage: string;
  createdAt?: string;
  openRoles: Array<{ id: string; title: string; isOpen?: boolean }>;
  _count?: { applications?: number };
};

type CofounderApplication = {
  id: string;
  status: "PENDIENTE" | "EN_REVISION" | "ACEPTADO" | "RECHAZADO";
  motivation: string;
  createdAt: string;
  startup: { id: string; name: string; stage: string };
  role?: { id: string; title: string } | null;
  applicant: { id: string; name: string; email: string; avatarUrl?: string | null; headline?: string | null };
};

const STATUS_BADGE: Record<CofounderApplication["status"], string> = {
  PENDIENTE: "bg-amber-100 text-amber-800",
  EN_REVISION: "bg-primary/15 text-primary",
  ACEPTADO: "bg-emerald-100 text-emerald-700",
  RECHAZADO: "bg-rose-100 text-rose-700",
};

const EmprendedorDashboard = () => {
  const user = useAuthStore((state) => state.user);

  const { data: startups = [], isLoading: loadingStartups } = useQuery<StartupOwned[]>({
    queryKey: ["startups", "my-owned", "dashboard"],
    queryFn: () => startupApi.myOwned().then((res) => res.data as StartupOwned[]),
  });

  const { data: applications = [], isLoading: loadingApplications } = useQuery<CofounderApplication[]>({
    queryKey: ["startups", "my-applications", "dashboard"],
    queryFn: () => startupApi.myApplications().then((res) => res.data as CofounderApplication[]),
  });

  const { data: overview } = useQuery({
    queryKey: ["startups", "overview"],
    queryFn: () => startupApi.overview().then((res) => res.data as { startups: number; applications: Record<string, number> }),
  });

  const stats = useMemo(() => {
    const openRoles = startups.reduce((sum, startup) => sum + startup.openRoles.filter((role) => role.isOpen !== false).length, 0);
    const pendingApplicants = applications.filter((app) => app.status === "PENDIENTE").length;
    const inReview = applications.filter((app) => app.status === "EN_REVISION").length;

    return [
      {
        label: "Proyectos activos",
        value: overview?.startups ?? startups.length,
        icon: Rocket,
        detail: openRoles > 0 ? `${openRoles} roles abiertos` : "Sin roles abiertos",
      },
      {
        label: "Postulantes nuevos",
        value: overview?.applications?.PENDIENTE ?? pendingApplicants,
        icon: Users,
        detail: pendingApplicants ? "Pendientes de revisar" : "Todo al día",
      },
      {
        label: "En conversación",
        value: overview?.applications?.EN_REVISION ?? inReview,
        icon: MessageSquare,
        detail: inReview ? "Seguimiento activo" : "Sin conversaciones",
      },
    ];
  }, [applications, startups, overview]);

  const topProjects = startups.slice(0, 3);
  const recentApplicants = applications.slice(0, 4);

  const formatRelative = (value: string) => {
    if (!value) return "Hace poco";
    try {
      return formatDistanceToNow(new Date(value), { addSuffix: true, locale: es });
    } catch {
      return "Hace poco";
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Panel de Emprendedor</p>
          <h1 className="mt-1 font-display text-3xl md:text-4xl font-bold text-foreground">Hola, {user?.name || "Usuario"}</h1>
          <p className="mt-2 text-muted-foreground font-sans">Construye tu equipo fundador y haz crecer tu startup.</p>
        </div>
        <Link to="/app/startup/publicar" className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-subtitle font-semibold text-sm">
          <Lightbulb className="h-4 w-4" /> Publicar nuevo proyecto
        </Link>
      </header>

      <div className="grid sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <article key={s.label} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <s.icon className="h-5 w-5 text-primary" />
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-4 font-display text-3xl font-bold text-foreground">{s.value}</p>
            <p className="text-sm font-subtitle font-semibold">{s.label}</p>
            <p className="text-xs text-muted-foreground mt-1 font-sans">{s.detail}</p>
          </article>
        ))}
      </div>

      <AIRecommendations role="emprendedor" />

      <section className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-subtitle font-semibold">Tus proyectos</h2>
          <Link to="/app/startup/proyectos" className="text-xs font-subtitle font-semibold underline underline-offset-4">Ver todos</Link>
        </div>
        <ul className="divide-y divide-border">
          {loadingStartups && (
            <li className="p-5 text-sm text-muted-foreground inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando proyectos...
            </li>
          )}

          {!loadingStartups && topProjects.length === 0 && (
            <li className="p-5 text-sm text-muted-foreground">
              Todavía no publicaste startups. Usa el botón de publicar para crear tu primer proyecto.
            </li>
          )}

          {topProjects.map((project) => (
            <li key={project.id}>
              <Link to={`/app/startup/proyectos/${project.id}`} className="p-5 flex items-center gap-4 hover:bg-surface-elevated/50 transition rounded-none">
                <div className="h-11 w-11 rounded-xl bg-foreground text-background flex items-center justify-center font-semibold">
                  {project.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-subtitle font-semibold truncate">{project.name}</p>
                  <p className="text-xs text-muted-foreground font-sans line-clamp-1">
                    Etapa: {project.stage} · {project.tagline || "Sin tagline"}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-surface-elevated font-subtitle">
                  {(project._count?.applications || 0)} postulantes
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-subtitle font-semibold">Postulaciones recientes</h2>
            <p className="text-xs text-muted-foreground">Últimos interesados en tus startups.</p>
          </div>
          <Link to="/app/startup/postulantes" className="text-xs font-subtitle font-semibold underline underline-offset-4">
            Gestionar postulantes
          </Link>
        </div>
        <ul className="space-y-3">
          {loadingApplications && (
            <li className="text-sm text-muted-foreground inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando postulaciones...
            </li>
          )}
          {!loadingApplications && recentApplicants.length === 0 && (
            <li className="text-sm text-muted-foreground">No hay postulaciones nuevas.</li>
          )}
          {recentApplicants.map((application) => (
            <li key={application.id} className="rounded-xl border border-border p-4 flex flex-wrap items-start gap-3">
              <div className="flex-1 min-w-[220px]">
                <p className="font-subtitle font-semibold">{application.applicant.name}</p>
                <p className="text-xs text-muted-foreground font-sans">
                  {application.startup.name} · {application.role?.title || "Rol general"} · {formatRelative(application.createdAt)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{application.motivation}</p>
              </div>
              <span className={`text-[11px] px-3 py-1 rounded-full font-subtitle font-semibold ${STATUS_BADGE[application.status]}`}>
                {application.status === "PENDIENTE"
                  ? "Nuevo"
                  : application.status === "EN_REVISION"
                    ? "En revisión"
                    : application.status === "ACEPTADO"
                      ? "Aceptado"
                      : "Rechazado"}
              </span>
              <Link
                to="/app/startup/postulantes"
                className="inline-flex items-center gap-1 text-xs font-subtitle font-semibold text-primary"
              >
                Ver detalle <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid md:grid-cols-2 gap-4">
        <Link to="/app/startup/cofounders" className="rounded-2xl border border-border bg-card p-5 hover:border-foreground transition-colors">
          <Handshake className="h-5 w-5 text-primary" />
          <h3 className="mt-3 font-subtitle font-semibold">Encuentra cofundadores</h3>
          <p className="text-xs text-muted-foreground mt-1 font-sans">Profesionales validados buscando proyectos como el tuyo.</p>
        </Link>
        <Link to="/app/startup/postulantes" className="rounded-2xl border border-border bg-card p-5 hover:border-foreground transition-colors">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="mt-3 font-subtitle font-semibold">Postulantes nuevos</h3>
          <p className="text-xs text-muted-foreground mt-1 font-sans">Revisa quién quiere unirse a tus proyectos.</p>
        </Link>
      </div>
    </div>
  );
};

export default EmprendedorDashboard;
