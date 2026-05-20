import { Link, Navigate, useParams } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { applicationsApi, jobsApi, savedApi, userApi } from "@/lib/api";
import { buildDynamicResources } from "./recursosData";

type InternshipJob = {
  id: string;
};

type StudentApplication = {
  status?: string;
};

const looksLikeInternship = (job: Record<string, unknown>) => {
  const text = [
    String(job.type || ""),
    String(job.title || ""),
    String(job.description || ""),
    String(job.requirements || ""),
  ]
    .join(" ")
    .toLowerCase();

  return (
    text.includes("pasant") ||
    text.includes("práct") ||
    text.includes("pract") ||
    text.includes("intern") ||
    text.includes("pasante") ||
    text.includes("trainee")
  );
};

const RecursoDetalle = () => {
  const { resourceId } = useParams<{ resourceId: string }>();

  const { data: me, isLoading: loadingMe } = useQuery({
    queryKey: ["users", "me"],
    queryFn: () => userApi.me().then((res) => res.data as { profileCompletion?: number }),
  });

  const { data: applications = [], isLoading: loadingApplications } = useQuery<StudentApplication[]>({
    queryKey: ["applications", "my"],
    queryFn: () => applicationsApi.my().then((res) => res.data || []),
  });

  const { data: savedJobs = [], isLoading: loadingSaved } = useQuery<Array<{ id: string }>>({
    queryKey: ["saved", "jobs"],
    queryFn: () => savedApi.getJobs().then((res) => res.data || []),
  });

  const { data: internships = [], isLoading: loadingInternships } = useQuery<InternshipJob[]>({
    queryKey: ["estudiante", "recursos", "internships-signal"],
    queryFn: async () => {
      const response = await jobsApi.list({ limit: 40, sort: "recent" });
      const payload = response.data as
        | Array<Record<string, unknown>>
        | { jobs?: Array<Record<string, unknown>> };

      const jobs = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.jobs)
          ? payload.jobs
          : [];

      return jobs
        .filter(looksLikeInternship)
        .map((job) => ({ id: String(job.id || "") }))
        .filter((job) => Boolean(job.id));
    },
  });

  const loading = loadingMe || loadingApplications || loadingSaved || loadingInternships;

  const activeApplications = applications.filter((application) => {
    const status = String(application.status || "").toUpperCase();
    return status !== "RECHAZADO" && status !== "CONTRATADO";
  }).length;

  const resources = buildDynamicResources(
    Number(me?.profileCompletion || 0),
    activeApplications,
    savedJobs.length,
    internships.length
  );

  const resource = resources.find((item) => item.id === resourceId);

  if (!resourceId) {
    return <Navigate to="/app/estudiante/recursos" replace />;
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground inline-flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando playbook...
      </div>
    );
  }

  if (!resource) {
    return <Navigate to="/app/estudiante/recursos" replace />;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={resource.type}
        title={resource.title}
        subtitle="Playbook accionable para avanzar con foco esta semana."
      />

      <Link to="/app/estudiante/recursos" className="inline-flex items-center gap-1.5 text-xs font-subtitle font-semibold underline underline-offset-4">
        <ArrowLeft className="h-3.5 w-3.5" /> Volver a recursos
      </Link>

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-subtitle font-semibold">Resumen</p>
          <p className="text-xs text-muted-foreground font-sans">Tiempo estimado: {resource.duration}</p>
        </div>
        <p className="mt-2 text-sm text-muted-foreground font-sans">{resource.intro}</p>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <p className="text-sm font-subtitle font-semibold">Pasos recomendados</p>
        <ol className="mt-3 space-y-2">
          {resource.steps.map((step, index) => (
            <li key={step} className="text-sm font-sans text-foreground/90">
              <span className="font-subtitle font-semibold mr-1.5">{index + 1}.</span>
              {step}
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <p className="text-sm font-subtitle font-semibold">Siguiente acción</p>
        <p className="mt-1 text-xs text-muted-foreground font-sans">Aplica esta guía en el flujo correspondiente.</p>
        <Link
          to={resource.to}
          className="mt-3 inline-flex h-10 items-center rounded-xl bg-foreground px-4 text-sm font-subtitle font-semibold text-background hover:bg-foreground/90"
        >
          {resource.ctaLabel}
        </Link>
      </section>
    </div>
  );
};

export default RecursoDetalle;
