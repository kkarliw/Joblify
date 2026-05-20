import { PageHeader } from "@/components/PageHeader";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { applicationsApi, jobsApi, savedApi, userApi } from "@/lib/api";
import { Link } from "react-router-dom";
import { buildDynamicResources } from "./recursosData";

type InternshipJob = {
  id: string;
  skills?: Array<{ name?: string }>;
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

const Recursos = () => {
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
        .map((job) => ({
          id: String(job.id || ""),
          skills: Array.isArray(job.skills)
            ? (job.skills as Array<{ name?: string }>)
            : [],
        }))
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

  return (
    <div>
      <PageHeader eyebrow="Aprende" title="Recursos y playbooks" subtitle="Acciones recomendadas según tu estado real dentro de la plataforma." />

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Preparando tus recursos...
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((r) => (
            <article key={r.id} className="rounded-2xl border border-border bg-card p-5 hover:border-foreground transition-colors">
              <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center mb-3">
                <r.icon className="h-5 w-5 text-foreground" />
              </div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-subtitle font-semibold">{r.type}</p>
              <h3 className="mt-1 font-subtitle font-semibold">{r.title}</h3>
              <p className="mt-2 text-xs text-muted-foreground font-sans">{r.intro}</p>

              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-sans">{r.duration}</p>
                <Link to={`/app/estudiante/recursos/${r.id}`} className="text-xs font-subtitle font-semibold underline underline-offset-4">
                  Abrir playbook
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default Recursos;
