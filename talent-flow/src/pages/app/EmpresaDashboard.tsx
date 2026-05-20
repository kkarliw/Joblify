import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Briefcase, Users, KanbanSquare, Plus, TrendingUp, Star, MessageSquare, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { applicationsApi, jobsApi } from "@/lib/api";
import { AIRecommendations } from "@/components/AIRecommendations";

type JobItem = {
  id: string;
  title: string;
  isActive?: boolean;
  createdAt: string;
  _count?: { applications?: number };
};

type ApplicationItem = {
  id: string;
  jobId: string;
  status: "APLICADO" | "SCREENING" | "ENTREVISTA" | "OFERTA" | "CONTRATADO" | "RECHAZADO";
  matchScore?: number | null;
  createdAt: string;
  applicant: {
    id: string;
    name: string;
    headline?: string | null;
    location?: string | null;
    matchScore?: number | null;
  };
};

const STAGE_LABEL: Record<ApplicationItem["status"], string> = {
  APLICADO: "Aplicado",
  SCREENING: "Screening",
  ENTREVISTA: "Entrevista",
  OFERTA: "Oferta",
  CONTRATADO: "Seleccionado",
  RECHAZADO: "No seleccionado",
};

const PIPELINE_STATUSES: Array<ApplicationItem["status"]> = ["APLICADO", "SCREENING", "ENTREVISTA", "OFERTA"];

const toPct = (value: number) => `${Math.round(value)}%`;

const toEmployerScore = (responseRate: number, hireRate: number) => {
  const weighted = 3 + responseRate * 1.3 + hireRate * 0.7;
  return Math.max(1, Math.min(5, Number(weighted.toFixed(1))));
};

const EmpresaDashboard = () => {
  const user = useAuthStore((state) => state.user);

  const { data: jobs = [], isLoading: loadingJobs } = useQuery<JobItem[]>({
    queryKey: ["empresa", "vacantes", "my"],
    queryFn: async () => {
      const { data } = await jobsApi.myPosted();
      return data as JobItem[];
    },
    enabled: !!user,
  });

  const jobIds = useMemo(() => jobs.map((job) => job.id), [jobs]);

  const { data: applications = [], isLoading: loadingApplications } = useQuery<ApplicationItem[]>({
    queryKey: ["empresa", "applications", "by-jobs", jobIds],
    queryFn: async () => {
      if (jobIds.length === 0) return [];
      const responses = await Promise.all(jobIds.map((jobId) => applicationsApi.byJob(jobId)));
      return responses.flatMap((response) => response.data as ApplicationItem[]);
    },
    enabled: !!user && jobIds.length > 0,
  });

  const loading = loadingJobs || loadingApplications;

  const analytics = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const activeJobs = jobs.filter((job) => job.isActive !== false);
    const weekApplications = applications.filter((app) => new Date(app.createdAt) >= weekAgo);
    const inPipeline = applications.filter((app) => PIPELINE_STATUSES.includes(app.status));
    const reviewed = applications.filter((app) => app.status !== "APLICADO");
    const hired = applications.filter((app) => app.status === "CONTRATADO");
    const offers = applications.filter((app) => app.status === "OFERTA" || app.status === "CONTRATADO");

    const responseRate = applications.length > 0 ? reviewed.length / applications.length : 0;
    const hireRate = offers.length > 0 ? hired.length / offers.length : 0;
    const employerScore = toEmployerScore(responseRate, hireRate);

    const sentiment =
      responseRate >= 0.7 ? "Muy positiva" : responseRate >= 0.45 ? "Positiva" : responseRate >= 0.25 ? "Mixta" : "Mejorable";

    const acceptanceRate = offers.length > 0 ? (hired.length / offers.length) * 100 : 0;

    const topCandidates = [...applications]
      .sort((a, b) => {
        const scoreA = typeof a.matchScore === "number" ? a.matchScore : typeof a.applicant.matchScore === "number" ? a.applicant.matchScore : 0;
        const scoreB = typeof b.matchScore === "number" ? b.matchScore : typeof b.applicant.matchScore === "number" ? b.applicant.matchScore : 0;
        return scoreB - scoreA;
      })
      .slice(0, 5)
      .map((app) => ({
        id: app.id,
        name: app.applicant.name,
        role: app.applicant.headline || "Perfil sin headline",
        stage: STAGE_LABEL[app.status],
        match:
          typeof app.matchScore === "number"
            ? Math.round(app.matchScore)
            : typeof app.applicant.matchScore === "number"
            ? Math.round(app.applicant.matchScore)
            : 0,
      }));

    const stats = [
      {
        label: "Vacantes activas",
        value: String(activeJobs.length),
        icon: Briefcase,
        trend: `${jobs.length} total`,
      },
      {
        label: "Candidatos esta semana",
        value: String(weekApplications.length),
        icon: Users,
        trend: `${applications.length} acumulado`,
      },
      {
        label: "En pipeline",
        value: String(inPipeline.length),
        icon: KanbanSquare,
        trend: `${offers.length} en oferta/selección`,
      },
    ];

    const brandSignals = [
      {
        label: "Calificación Joblify",
        value: `${employerScore}/5`,
        helper: `${applications.length} postulaciones analizadas`,
        icon: Star,
        tone: "text-amber-600",
      },
      {
        label: "Percepción de candidatos",
        value: sentiment,
        helper: `${toPct(responseRate * 100)} de postulaciones con avance de etapa`,
        icon: MessageSquare,
        tone: "text-blue-600",
      },
      {
        label: "Tasa de aceptación",
        value: toPct(acceptanceRate),
        helper: `${hired.length} contratados de ${offers.length || 0} ofertas`,
        icon: TrendingUp,
        tone: "text-emerald-600",
      },
    ];

    const reputationHighlights = [
      responseRate >= 0.7
        ? "Tu equipo está moviendo candidatos con buena velocidad en el pipeline."
        : "Puedes mejorar la percepción acelerando feedback en primeras etapas.",
      acceptanceRate >= 60
        ? "Tus ofertas están alineadas con expectativa del talento y se aceptan con frecuencia."
        : "Revisa compensación y claridad de la propuesta para subir aceptación.",
      activeJobs.length > 0
        ? `Tienes ${activeJobs.length} vacante(s) activa(s); mantener descripciones precisas mejora el match.`
        : "Publica una nueva vacante para reactivar señales de marca empleadora.",
    ];

    return {
      stats,
      topCandidates,
      brandSignals,
      reputationHighlights,
      hasData: jobs.length > 0 || applications.length > 0,
    };
  }, [jobs, applications]);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Panel de Empresa</p>
          <h1 className="mt-1 font-display text-3xl md:text-4xl font-bold text-foreground">Hola, {user?.name || "Usuario"}</h1>
          <p className="mt-2 text-muted-foreground font-sans">Resumen de tu reclutamiento hoy.</p>
        </div>
        <Link to="/app/empresa/publicar" className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-subtitle font-semibold text-sm">
          <Plus className="h-4 w-4" /> Publicar vacante
        </Link>
      </header>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-10 flex flex-col items-center justify-center text-muted-foreground">
          <Loader2 className="h-7 w-7 animate-spin mb-3" />
          Cargando métricas reales de tu empresa...
        </div>
      ) : !analytics.hasData ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <h3 className="font-subtitle font-semibold text-foreground">Aún no hay suficientes datos de reclutamiento</h3>
          <p className="text-sm text-muted-foreground mt-2 font-sans">Publica tu primera vacante para activar métricas reales de marca y pipeline.</p>
          <Link to="/app/empresa/publicar" className="inline-flex items-center gap-2 mt-4 h-10 px-4 rounded-xl bg-foreground text-background text-sm font-subtitle font-semibold">
            <Plus className="h-4 w-4" /> Publicar primera vacante
          </Link>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-3 gap-4">
            {analytics.stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between">
                  <s.icon className="h-5 w-5 text-primary" />
                  <span className="text-[10px] font-subtitle font-semibold uppercase tracking-wider text-emerald-600">{s.trend}</span>
                </div>
                <p className="mt-4 font-display text-3xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1 font-sans">{s.label}</p>
              </div>
            ))}
          </div>

          <AIRecommendations role="empresa" />

          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-[11px] font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Marca empleadora</p>
                <h2 className="mt-1 font-subtitle font-semibold text-foreground">Así te está viendo el talento en Joblify</h2>
              </div>
              <Link to="/app/empresa/vacantes" className="text-xs font-subtitle font-semibold underline underline-offset-4">Mejorar indicadores</Link>
            </div>

            <div className="mt-4 grid md:grid-cols-3 gap-3">
              {analytics.brandSignals.map((signal) => (
                <div key={signal.label} className="rounded-xl border border-border bg-surface-elevated p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">{signal.label}</p>
                    <signal.icon className={`h-4 w-4 ${signal.tone}`} />
                  </div>
                  <p className="mt-2 font-display text-2xl font-bold text-foreground">{signal.value}</p>
                  <p className="text-xs text-muted-foreground mt-1 font-sans">{signal.helper}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-border bg-white p-4">
              <p className="text-xs font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Lo que más destacan de tu empresa</p>
              <ul className="mt-2 space-y-1.5">
                {analytics.reputationHighlights.map((item) => (
                  <li key={item} className="text-sm text-foreground/90 font-sans">• {item}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-subtitle font-semibold">Top candidatos rankeados (IA)</h2>
              <Link to="/app/empresa/candidatos" className="text-xs font-subtitle font-semibold underline underline-offset-4">Ver todos</Link>
            </div>

            {analytics.topCandidates.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground font-sans">Todavía no hay candidatos rankeados para mostrar. Publica vacantes y recibe postulaciones para activar este ranking.</div>
            ) : (
              <ul className="divide-y divide-border">
                {analytics.topCandidates.map((c) => (
                  <li key={c.id} className="p-5 flex items-center gap-4 hover:bg-surface-elevated/50">
                    <div className="h-11 w-11 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-semibold">
                      {c.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-subtitle font-semibold truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground font-sans">{c.role}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-surface-elevated font-subtitle">{c.stage}</span>
                    <div className="text-right">
                      <p className="font-display text-lg font-bold text-primary">{c.match}%</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="grid md:grid-cols-2 gap-4">
            <Link to="/app/empresa/pipeline" className="rounded-2xl border border-border bg-card p-5 hover:border-foreground transition-colors">
              <KanbanSquare className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-subtitle font-semibold">Mueve tu pipeline</h3>
              <p className="text-xs text-muted-foreground mt-1 font-sans">Gestiona candidatos por etapa y acelera tus contrataciones.</p>
            </Link>
            <Link to="/app/empresa/vacantes" className="rounded-2xl border border-border bg-card p-5 hover:border-foreground transition-colors">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-subtitle font-semibold">Performance de vacantes</h3>
              <p className="text-xs text-muted-foreground mt-1 font-sans">Revisa resultados de cada oferta y optimiza conversiones.</p>
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default EmpresaDashboard;
