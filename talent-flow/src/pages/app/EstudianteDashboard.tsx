import { Link } from "react-router-dom";
import { GraduationCap, BookOpen, FileText, ArrowRight, Sparkles, Loader2, Bookmark } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useQuery } from "@tanstack/react-query";
import { applicationsApi, jobsApi, savedApi } from "@/lib/api";

type InternshipCard = {
  id: string;
  title: string;
  company: string;
  modality: string;
  salaryLabel: string;
};

type StudentApplication = {
  id: string;
  status?: string;
};

const moneyFormatter = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 0,
});

const EstudianteDashboard = () => {
  const user = useAuthStore((state) => state.user);

  const { data: internships = [], isLoading: loadingInternships } = useQuery<InternshipCard[]>({
    queryKey: ["estudiante", "dashboard", "practicas"],
    queryFn: async () => {
      const response = await jobsApi.list({ limit: 12, type: "PASANTIA", sort: "recent" });
      const payload = response.data as
        | Array<Record<string, unknown>>
        | { jobs?: Array<Record<string, unknown>> };

      const jobs = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.jobs)
          ? payload.jobs
          : [];

      return jobs
        .filter((job) => {
          const type = String(job.type || "").toLowerCase();
          const title = String(job.title || "").toLowerCase();
          return type.includes("pasant") || type.includes("intern") || title.includes("práct") || title.includes("pasant");
        })
        .slice(0, 6)
        .map((job) => {
          const salaryMin = Number(job.salaryMin || 0);
          const salaryMax = Number(job.salaryMax || 0);
          const salaryLabel = salaryMin > 0 || salaryMax > 0
            ? `${salaryMin > 0 ? `$${moneyFormatter.format(salaryMin)}` : "-"} · ${salaryMax > 0 ? `$${moneyFormatter.format(salaryMax)}` : "-"}`
            : "Compensación por definir";

          const poster = job.poster as { name?: string } | undefined;
          return {
            id: String(job.id || ""),
            title: String(job.title || "Práctica"),
            company: String(poster?.name || job.company || "Empresa"),
            modality: String(job.modality || "Remoto"),
            salaryLabel,
          };
        })
        .filter((job) => Boolean(job.id));
    },
  });

  const { data: applications = [], isLoading: loadingApplications } = useQuery<StudentApplication[]>({
    queryKey: ["applications", "my"],
    queryFn: () => applicationsApi.my().then((res) => res.data || []),
  });

  const { data: savedJobs = [], isLoading: loadingSaved } = useQuery<Array<{ id: string }>>({
    queryKey: ["saved", "jobs"],
    queryFn: () => savedApi.getJobs().then((res) => res.data || []),
  });

  const loading = loadingInternships || loadingApplications || loadingSaved;

  const activeApplications = applications.filter((application) => {
    const status = String(application.status || "").toUpperCase();
    return status !== "RECHAZADO" && status !== "CONTRATADO";
  }).length;

  const stats = [
    {
      label: "Prácticas sugeridas",
      value: internships.length,
      icon: GraduationCap,
      trend: internships.length > 0 ? "Actualizado" : "Sin resultados",
    },
    {
      label: "Aplicaciones activas",
      value: activeApplications,
      icon: FileText,
      trend: activeApplications > 0 ? "En proceso" : "Sin proceso",
    },
    {
      label: "Vacantes guardadas",
      value: savedJobs.length,
      icon: Bookmark,
      trend: savedJobs.length > 0 ? "Listas para aplicar" : "Sin guardados",
    },
  ];

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[11px] font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Panel de Estudiante</p>
        <h1 className="mt-1 font-display text-3xl md:text-4xl font-bold text-foreground">Hola, {user?.name || "Usuario"}</h1>
        <p className="mt-2 text-muted-foreground font-sans">Encuentra tu primera práctica y una ruta clara de recursos para arrancar tu carrera.</p>
      </header>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando tu panel...
        </div>
      ) : (
      <>
      <div className="grid sm:grid-cols-3 gap-4">
        {stats.map(s => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <s.icon className="h-5 w-5 text-primary" />
              <span className="text-[10px] font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">{s.trend}</span>
            </div>
            <p className="mt-4 font-display text-3xl font-bold text-foreground">{String(s.value)}</p>
            <p className="text-xs text-muted-foreground mt-1 font-sans">{s.label}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="font-subtitle font-semibold">Prácticas para ti</h2>
          </div>
          <Link to="/app/estudiante/practicas" className="text-xs font-subtitle font-semibold underline underline-offset-4">Ver todas</Link>
        </div>
        <ul className="divide-y divide-border">
          {internships.slice(0, 3).map(i => (
            <li key={i.id} className="p-5 flex items-center gap-4 hover:bg-surface-elevated/50">
              <div className="h-11 w-11 rounded-xl bg-foreground text-background flex items-center justify-center font-semibold">
                {i.company[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-subtitle font-semibold truncate">{i.title}</p>
                <p className="text-xs text-muted-foreground font-sans">{i.company} · {i.modality} · {i.salaryLabel}</p>
              </div>
              <Link to="/app/estudiante/practicas" className="text-xs font-subtitle font-semibold inline-flex items-center gap-1">
                Aplicar <ArrowRight className="h-4 w-4" />
              </Link>
            </li>
          ))}
          {internships.length === 0 && (
            <li className="p-5 text-sm text-muted-foreground">
              Aún no hay prácticas sugeridas para tu perfil. Revisa tus skills y vuelve a intentar más tarde.
            </li>
          )}
        </ul>
      </section>

      <div className="grid md:grid-cols-2 gap-4">
        <Link to="/app/estudiante/aplicaciones" className="rounded-2xl border border-border bg-card p-5 hover:border-foreground transition-colors">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="mt-3 font-subtitle font-semibold">Haz seguimiento a tus postulaciones</h3>
          <p className="text-xs text-muted-foreground mt-1 font-sans">Revisa estados, prioriza procesos activos y enfoca tus siguientes acciones.</p>
        </Link>
        <Link to="/app/estudiante/recursos" className="rounded-2xl border border-border bg-card p-5 hover:border-foreground transition-colors">
          <BookOpen className="h-5 w-5 text-primary" />
          <h3 className="mt-3 font-subtitle font-semibold">Recursos y workshops</h3>
          <p className="text-xs text-muted-foreground mt-1 font-sans">Material accionable para mejorar tu perfil y entrevistas.</p>
        </Link>
      </div>
      </>
      )}
    </div>
  );
};

export default EstudianteDashboard;
