import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Briefcase, Building2, Loader2, MapPin, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout as AppLayout } from "@/components/Layouts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { jobsApi } from "@/lib/api";

type JobItem = {
  id: string;
  title: string;
  location?: string;
  modality?: string;
  poster?: { id?: string; name?: string };
  createdAt?: string;
};

type CompanyItem = {
  id: string;
  name: string;
  jobsCount: number;
  locations: string[];
  latestJobId?: string;
  latestJobTitle?: string;
  latestCreatedAt?: string;
};

const getJobsFromResponse = (payload: unknown): JobItem[] => {
  if (Array.isArray(payload)) return payload as JobItem[];
  if (payload && typeof payload === "object") {
    const obj = payload as { jobs?: unknown };
    if (Array.isArray(obj.jobs)) return obj.jobs as JobItem[];
  }
  return [];
};

const Empresa = () => {
  const location = useLocation();
  const [q, setQ] = useState("");
  const isInAppRoute = location.pathname.startsWith("/app/");
  const appRoleSegment = isInAppRoute ? location.pathname.split("/")[2] : "";

  const buildCompanyDetailRoute = (companyId: string) => {
    if (appRoleSegment === "estudiante" || appRoleSegment === "talento" || appRoleSegment === "empresa") {
      return `/app/${appRoleSegment}/empresas/${companyId}`;
    }
    return `/empresa/${companyId}`;
  };

  const buildVacancyDetailRoute = (jobId?: string) => {
    if (!jobId) {
      if (appRoleSegment === "estudiante") return "/app/estudiante/practicas";
      if (appRoleSegment === "talento") return "/app/talento/vacantes";
      if (appRoleSegment === "empresa") return "/app/empresa/vacantes";
      return "/vacantes";
    }

    if (appRoleSegment === "estudiante") return `/app/estudiante/vacantes/${jobId}`;
    if (appRoleSegment === "talento") return `/app/talento/vacantes/${jobId}`;
    if (appRoleSegment === "empresa") return `/app/empresa/vacantes/${jobId}`;
    return `/vacantes/${jobId}`;
  };

  const { data: jobs = [], isLoading, isFetching, isError, refetch } = useQuery<JobItem[]>({
    queryKey: ["jobs", "companies", q],
    queryFn: async () => {
      const response = await jobsApi.list({ q: q.trim(), limit: 80 });
      return getJobsFromResponse(response.data);
    },
  });

  const companies = useMemo<CompanyItem[]>(() => {
    const grouped = new Map<string, CompanyItem>();

    jobs.forEach((job) => {
      const companyName = job.poster?.name?.trim() || "Empresa";
      const key = companyName.toLowerCase();
      const current = grouped.get(key);

      if (!current) {
        grouped.set(key, {
          id: job.poster?.id || key,
          name: companyName,
          jobsCount: 1,
          locations: job.location ? [job.location] : [],
          latestJobId: job.id,
          latestJobTitle: job.title,
          latestCreatedAt: job.createdAt,
        });
        return;
      }

      current.jobsCount += 1;
      if (job.location && !current.locations.includes(job.location)) {
        current.locations.push(job.location);
      }

      const currentDate = current.latestCreatedAt;
      const newDate = job.createdAt;
      if (!currentDate || (newDate && new Date(newDate).getTime() > new Date(currentDate).getTime())) {
        current.latestJobId = job.id;
        current.latestJobTitle = job.title;
        current.latestCreatedAt = newDate;
      }
    });

    return Array.from(grouped.values())
      .sort((a, b) => b.jobsCount - a.jobsCount)
      .slice(0, 40);
  }, [jobs]);

  const content = (
    <section className="max-w-[1200px] mx-auto px-6 lg:px-10 py-10 lg:py-12">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Empresas</h1>
          <p className="mt-2 text-muted-foreground font-sans">
            Empresas activas en Joblify, construidas desde vacantes reales publicadas en la plataforma.
          </p>

          <div className="mt-8 bg-white border border-border rounded-2xl p-2 flex flex-col sm:flex-row gap-2 shadow-[0_8px_30px_-16px_rgba(37,50,75,0.12)]">
            <div className="flex-1 flex items-center gap-2 px-3">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                placeholder="Buscar empresa o vacante"
                value={q}
                onChange={(event) => setQ(event.target.value)}
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
            <span className="shrink-0">{companies.length} empresas activas</span>
            {(isLoading || isFetching) && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>

          {isError ? (
            <div className="rounded-2xl border border-border bg-white p-6 text-sm text-muted-foreground">
              No pudimos cargar empresas ahora. Intenta de nuevo en unos segundos.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {companies.map((company) => (
                <article key={company.id} className="rounded-2xl border border-border bg-white p-6 flex flex-col">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-foreground text-background flex items-center justify-center">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-subtitle font-semibold text-base truncate">{company.name}</h2>
                      <p className="text-xs text-muted-foreground font-sans">
                        {company.jobsCount} vacante{company.jobsCount === 1 ? "" : "s"} activa{company.jobsCount === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground font-sans">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="line-clamp-1">{company.locations.slice(0, 2).join(" · ") || "LATAM / Remoto"}</span>
                  </div>

                  <div className="mt-3 text-sm text-foreground font-sans line-clamp-2 min-h-[40px]">
                    {company.latestJobTitle || "Nueva oportunidad disponible"}
                  </div>

                  <div className="mt-4 pt-4 border-t border-border flex gap-2">
                    <Button
                      asChild
                      className="flex-1 h-10 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-subtitle font-semibold"
                    >
                      <Link to={buildCompanyDetailRoute(company.id)}>Ver empresa</Link>
                    </Button>
                    <Button asChild variant="outline" className="h-10 rounded-xl font-subtitle px-3">
                      <Link to={buildVacancyDetailRoute(company.latestJobId)}>
                        <Briefcase className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </article>
              ))}

              {!isLoading && companies.length === 0 && (
                <div className="md:col-span-2 xl:col-span-3 rounded-2xl border border-border bg-white p-8 text-center">
                  <h3 className="font-subtitle font-semibold text-foreground">No encontramos empresas con esa búsqueda</h3>
                  <p className="text-sm text-muted-foreground mt-2">Prueba con otro término o revisa vacantes activas.</p>
                </div>
              )}
            </div>
          )}
        </div>
    </section>
  );

  if (isInAppRoute) {
    return content;
  }

  return (
    <AppLayout>
      {content}
    </AppLayout>
  );
};

export default Empresa;
