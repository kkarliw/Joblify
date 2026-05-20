import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, MapPin, Briefcase, Loader2, Clock3, CircleDollarSign, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout as AppLayout } from "@/components/Layouts";
import { CompanyLogo } from "@/components/Brand";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { jobsApi } from "@/lib/api";

type JobSkill = { skill?: { name?: string } };

const buildVacancyPreview = (description?: string, requirements?: string) => {
  const source = (description || requirements || "").replace(/\s+/g, " ").trim();
  if (!source) {
    return "Sin descripción registrada.";
  }
  return source.length > 170 ? `${source.slice(0, 170)}...` : source;
};

type JobApiItem = {
  id: string;
  title: string;
  description?: string;
  requirements?: string;
  location?: string;
  modality?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  createdAt?: string;
  matchScore?: number;
  poster?: { name?: string; avatarUrl?: string; isVerified?: boolean };
  skills?: JobSkill[];
  type?: string;
};

const getJobsFromResponse = (payload: unknown): JobApiItem[] => {
  if (Array.isArray(payload)) return payload as JobApiItem[];
  if (payload && typeof payload === "object") {
    const obj = payload as { jobs?: unknown };
    if (Array.isArray(obj.jobs)) return obj.jobs as JobApiItem[];
  }
  return [];
};

const formatSalary = (job: JobApiItem) => {
  if (typeof job.salaryMin === "number" && typeof job.salaryMax === "number") {
    return `${job.salaryCurrency || "USD"} ${job.salaryMin} - ${job.salaryMax}`;
  }
  return "Salario a convenir";
};

const formatPostedAt = (createdAt?: string) => {
  if (!createdAt) return "Reciente";
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "Reciente";
  return date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
  });
};

const typeLabel: Record<string, string> = {
  FULL_TIME: "Tiempo completo",
  PART_TIME: "Medio tiempo",
  FREELANCE: "Freelance",
  PASANTIA: "Pasantía",
};

const modalityLabel: Record<string, string> = {
  REMOTO: "Remoto",
  HIBRIDO: "Híbrido",
  PRESENCIAL: "Presencial",
};

const Vacantes = () => {
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");

  const { data: jobs = [], isLoading, isError, isFetching, refetch } = useQuery<JobApiItem[]>({
    queryKey: ["jobs", "public", q],
    queryFn: async () => {
      const response = await jobsApi.list({ q: q.trim(), limit: 40 });
      return getJobsFromResponse(response.data);
    },
  });

  const filteredJobs = useMemo(() => {
    if (!location.trim()) return jobs;
    const normalizedLocation = location.toLowerCase();
    return jobs.filter((job) => job.location?.toLowerCase().includes(normalizedLocation));
  }, [jobs, location]);

  return (
    <AppLayout>
      <section className="max-w-[1200px] mx-auto px-6 lg:px-10 py-10 lg:py-12">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Vacantes</h1>
          <p className="mt-2 text-muted-foreground font-sans">
            Oportunidades reales publicadas por empresas activas en Joblify.
          </p>

          <div className="mt-8 bg-white border border-border rounded-2xl p-2 flex flex-col sm:flex-row gap-2 shadow-[0_8px_30px_-16px_rgba(37,50,75,0.12)]">
            <div className="flex-1 flex items-center gap-2 px-3">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                placeholder="Cargo, empresa o skill"
                value={q}
                onChange={(event) => setQ(event.target.value)}
                className="border-0 shadow-none focus-visible:ring-0 h-11 px-0 font-sans text-sm"
              />
            </div>
            <div className="hidden sm:block w-px bg-border my-2" />
            <div className="flex-1 sm:max-w-xs flex items-center gap-2 px-3">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                placeholder="Filtrar por ubicación"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className="border-0 shadow-none focus-visible:ring-0 h-11 px-0 font-sans text-sm"
              />
            </div>
            <Button
              onClick={() => refetch()}
              className="h-11 px-6 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-subtitle font-semibold"
            >
              Buscar
            </Button>
          </div>
        </div>

        <div className="mt-8 lg:mt-10">
          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground mb-5 font-sans">
            <span className="shrink-0">{filteredJobs.length} resultados</span>
            {(isLoading || isFetching) && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>

          {isError ? (
            <div className="rounded-2xl border border-border bg-white p-6 text-sm text-muted-foreground">
              No pudimos cargar vacantes ahora. Intenta de nuevo en unos segundos.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredJobs.map((job) => {
                const company = job.poster?.name || "Empresa";
                const skills = Array.isArray(job.skills)
                  ? job.skills.map((entry) => entry.skill?.name).filter((name): name is string => Boolean(name))
                  : [];

                return (
                  <Link
                    key={job.id}
                    to={`/vacantes/${job.id}`}
                    className="group p-5 rounded-2xl border border-border bg-white hover:border-foreground hover:shadow-[0_8px_30px_-12px_rgba(37,50,75,0.15)] transition-all block"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <CompanyLogo initial={company.slice(0, 1).toUpperCase()} imageUrl={job.poster?.avatarUrl} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-subtitle font-semibold truncate">{company}</p>
                            {job.poster?.isVerified && <ShieldCheck className="h-3.5 w-3.5 text-[#FFB100]" />}
                          </div>
                          {typeof job.matchScore === "number" && <p className="text-xs text-muted-foreground">{job.matchScore}% match</p>}
                        </div>
                      </div>

                      <div className="rounded-lg bg-[#FDF7E7] px-3 py-1.5 text-right shrink-0">
                        <p className="text-sm font-subtitle font-semibold text-foreground">{formatSalary(job)}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">{job.salaryCurrency || "USD"} / mes</p>
                      </div>
                    </div>

                    <h3 className="mt-3 font-subtitle font-semibold text-[30px] leading-tight tracking-tight">{job.title}</h3>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground font-sans">
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {job.location || "Remoto"}</span>
                      <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {modalityLabel[job.modality || ""] || job.modality || "Modalidad flexible"}</span>
                      <span className="inline-flex items-center gap-1"><CircleDollarSign className="h-3.5 w-3.5" /> {typeLabel[job.type || ""] || job.type || "Tiempo completo"}</span>
                      <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> Publicada {formatPostedAt(job.createdAt)}</span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {(skills.length > 0 ? skills : ["General"]).slice(0, 4).map((skill) => (
                        <span key={skill} className="text-[11px] font-medium px-2.5 py-1 rounded-md border border-border bg-surface-elevated font-sans">
                          {skill}
                        </span>
                      ))}
                    </div>

                    <p className="mt-2 text-sm text-muted-foreground font-sans max-w-4xl">
                      {buildVacancyPreview(job.description, job.requirements)}
                    </p>

                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-end text-xs">
                      <span className="text-primary font-subtitle font-semibold">Ver detalle</span>
                    </div>
                  </Link>
                );
              })}

              {!isLoading && filteredJobs.length === 0 && (
                <div className="sm:col-span-2 rounded-2xl border border-border bg-white p-8 text-center">
                  <h3 className="font-subtitle font-semibold text-foreground">No encontramos vacantes con esos filtros</h3>
                  <p className="text-sm text-muted-foreground mt-2">Prueba con otro cargo, skill o ubicación.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </AppLayout>
  );
};

export default Vacantes;
