import { Link, useLocation, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Briefcase, Clock, DollarSign, Bookmark, Share2, Sparkles, Loader2, Globe, BadgeCheck, Users } from "lucide-react";
import { PublicLayout as AppLayout } from "@/components/Layouts";
import { CompanyLogo } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { LoginRequiredDialog } from "@/components/LoginRequiredDialog";
import { AIMatchBadge } from "@/components/AIMatchBadge";
import { applicationsApi, jobsApi } from "@/lib/api";
import { hasRealSession } from "@/lib/session";
import { isJobSaved, toggleSaveJob } from "@/lib/saved";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

type JobSkill = { name?: string; skill?: { name?: string } };

type JobDetail = {
  id: string;
  title: string;
  description?: string;
  requirements?: string | string[] | { skills?: string[] } | Record<string, unknown>;
  benefits?: string;
  location?: string;
  modality?: string;
  type?: string;
  salary?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  skills?: JobSkill[];
  createdAt?: string;
  matchScore?: number;
  poster?: {
    id?: string;
    name?: string;
    avatarUrl?: string;
    coverUrl?: string;
    headline?: string;
    bio?: string;
    location?: string;
    website?: string;
    linkedinUrl?: string;
    isVerified?: boolean;
  };
  companyStats?: {
    activeJobs?: number;
    hires?: number;
  };
  relatedJobs?: Array<{
    id: string;
    title: string;
    location?: string;
    modality?: string;
    type?: string;
    salaryMin?: number;
    salaryMax?: number;
    salaryCurrency?: string;
    createdAt?: string;
  }>;
};

type ApplyError = { response?: { status?: number; data?: { error?: string } } };
type MyApplication = { id: string; jobId?: string };

const getJobFromResponse = (payload: unknown): JobDetail | null => {
  if (payload && typeof payload === "object") {
    const asObject = payload as { job?: unknown };
    if (asObject.job && typeof asObject.job === "object") {
      return asObject.job as JobDetail;
    }
    return payload as JobDetail;
  }
  return null;
};

const formatSalary = (job: JobDetail) => {
  if (job.salary) return job.salary;
  if (typeof job.salaryMin === "number" && typeof job.salaryMax === "number") {
    return `${job.salaryCurrency || "USD"} ${job.salaryMin} - ${job.salaryMax}`;
  }
  return "Salario a convenir";
};

const getSkills = (job: JobDetail) => {
  if (Array.isArray(job.skills)) {
    return job.skills
      .map((entry) => entry.skill?.name || entry.name)
      .filter((name): name is string => Boolean(name));
  }

  if (job.requirements && typeof job.requirements === "object") {
    const req = job.requirements as { skills?: unknown };
    if (Array.isArray(req.skills)) {
      return req.skills.filter((skill): skill is string => typeof skill === "string");
    }
  }

  return [];
};

const toBulletList = (value?: string | string[] | Record<string, unknown>) => {
  if (!value) return [] as string[];
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/\n|•|-|\*/g)
      .map((item) => item.trim())
      .filter((item) => item.length > 3);
  }
  return [] as string[];
};

const formatCompactSalary = (salaryMin?: number, salaryMax?: number, salaryCurrency = "USD") => {
  if (typeof salaryMin === "number" && typeof salaryMax === "number") {
    return `${salaryCurrency} ${salaryMin} - ${salaryMax}`;
  }
  return "Salario a convenir";
};

const VacanteDetalle = () => {
  const { id } = useParams();
  const location = useLocation();
  const { user, token, refreshToken } = useAuthStore();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [loginTarget, setLoginTarget] = useState("/login");

  const isAuthenticated = hasRealSession(user, token, refreshToken);
  const isInAppRoute = location.pathname.startsWith("/app/");
  const appRoleSegment = isInAppRoute ? location.pathname.split("/")[2] : "";
  const listRoute = appRoleSegment === "estudiante"
    ? "/app/estudiante/practicas"
    : appRoleSegment === "talento"
      ? "/app/talento/vacantes"
      : appRoleSegment === "empresa"
        ? "/app/empresa/vacantes"
        : "/vacantes";
  const buildDetailRoute = (jobId: string) => {
    if (appRoleSegment === "estudiante") return `/app/estudiante/vacantes/${jobId}`;
    if (appRoleSegment === "talento") return `/app/talento/vacantes/${jobId}`;
    if (appRoleSegment === "empresa") return `/app/empresa/vacantes/${jobId}`;
    return `/vacantes/${jobId}`;
  };
  const companiesRoute = (appRoleSegment === "estudiante" || appRoleSegment === "talento" || appRoleSegment === "empresa")
    ? `/app/${appRoleSegment}/empresas`
    : "/empresa";

  const requestLogin = (message: string) => {
    setLoginTarget(`/login?next=${encodeURIComponent(window.location.pathname)}`);
    setAuthDialogOpen(true);
    toast.info(message);
  };

  const { data: job, isLoading, isError } = useQuery<JobDetail | null>({
    queryKey: ["job", "detail", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await jobsApi.get(id as string);
      return getJobFromResponse(response.data);
    },
  });

  const { data: myApplications = [] } = useQuery<MyApplication[]>({
    queryKey: ["applications", "my", "for-job", id],
    queryFn: () => applicationsApi.my().then((res) => res.data || []),
    enabled: Boolean(id) && isAuthenticated,
    staleTime: 1000 * 30,
  });

  useEffect(() => {
    if (job?.id) {
      setSaved(isJobSaved(job.id));
    }
  }, [job?.id]);

  const applyMutation = useMutation({
    mutationFn: (jobId: string) => {
      if (!isAuthenticated) {
        throw new Error("AUTH_REQUIRED");
      }
      return applicationsApi.apply(jobId);
    },
    onSuccess: () => {
      toast.success("Aplicación enviada");
      queryClient.invalidateQueries({ queryKey: ["applications", "my"] });
    },
    onError: (error: unknown) => {
      if (error instanceof Error && error.message === "AUTH_REQUIRED") {
        requestLogin("Inicia sesión para postularte a esta vacante");
        return;
      }
      if ((error as ApplyError)?.response?.status === 409) {
        toast.info("Ya aplicaste a esta vacante");
        return;
      }
      const message = (error as ApplyError)?.response?.data?.error || "No se pudo aplicar";
      toast.error(message);
    },
  });

  const skills = useMemo(() => (job ? getSkills(job) : []), [job]);
  const requirementItems = useMemo(() => toBulletList(job?.requirements), [job?.requirements]);
  const benefitItems = useMemo(() => toBulletList(job?.benefits), [job?.benefits]);
  const hasApplied = useMemo(
    () => Boolean(job?.id && myApplications.some((app) => app.jobId === job.id)),
    [job?.id, myApplications],
  );

  const postedAt = useMemo(() => {
    if (!job?.createdAt) return "recientemente";
    const date = new Date(job.createdAt);
    if (Number.isNaN(date.getTime())) return "recientemente";
    return date.toLocaleDateString("es-CO", { day: "2-digit", month: "short" }).toLowerCase();
  }, [job?.createdAt]);

  if (isLoading) {
    const content = (
      <section className="max-w-[1100px] mx-auto px-6 lg:px-10 py-12 flex justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </section>
    );

    if (isInAppRoute) return content;

    return (
      <AppLayout>
        {content}
      </AppLayout>
    );
  }

  if (isError || !job) {
    const content = (
      <section className="max-w-[900px] mx-auto px-6 lg:px-10 py-12">
        <Link to={listRoute} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 font-sans">
          <ArrowLeft className="h-3.5 w-3.5" /> Volver a vacantes
        </Link>
        <div className="mt-6 rounded-2xl border border-border bg-white p-8 text-center">
          <h1 className="font-display text-2xl font-bold">No pudimos cargar esta vacante</h1>
          <p className="text-sm text-muted-foreground mt-2">Intenta de nuevo en unos segundos.</p>
        </div>
      </section>
    );

    if (isInAppRoute) return content;

    return (
      <AppLayout>
        {content}
      </AppLayout>
    );
  }

  const companyName = job.poster?.name || "Empresa";
  const salary = formatSalary(job);
  const companyWebsite = job.poster?.website || "";
  const companyLinkedIn = job.poster?.linkedinUrl || "";
  const companyLocation = job.poster?.location || job.location || "Remoto";
  const relatedJobs = Array.isArray(job.relatedJobs) ? job.relatedJobs : [];
  const companyDetailRoute = job.poster?.id
    ? ((appRoleSegment === "estudiante" || appRoleSegment === "talento" || appRoleSegment === "empresa")
      ? `/app/${appRoleSegment}/empresas/${job.poster.id}`
      : `/empresa/${job.poster.id}`)
    : companiesRoute;

  const content = (
    <section className="max-w-[1100px] mx-auto px-6 lg:px-10 py-10 lg:py-12">
      <Link to={listRoute} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 font-sans">
          <ArrowLeft className="h-3.5 w-3.5" /> Volver a vacantes
      </Link>

        <div className="mt-6 grid lg:grid-cols-[1fr_340px] gap-8">
          <div className="space-y-6">
            <div className="bg-white border border-border rounded-2xl p-7 lg:p-8">
              {job.poster?.coverUrl && (
                <div className="mb-5 rounded-xl overflow-hidden border border-border h-32">
                  <img src={job.poster.coverUrl} alt={companyName} className="w-full h-full object-cover" />
                </div>
              )}

              <div className="flex items-start gap-5">
                <CompanyLogo initial={companyName.slice(0, 1).toUpperCase()} imageUrl={job.poster?.avatarUrl} size="lg" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Vacante activa</p>
                    {job.poster?.isVerified && (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-subtitle font-semibold">
                        <BadgeCheck className="h-3.5 w-3.5" /> Empresa verificada
                      </span>
                    )}
                  </div>
                  <h1 className="font-display text-2xl md:text-3xl font-bold leading-tight tracking-tight">{job.title}</h1>
                  <p className="mt-1.5 text-muted-foreground font-sans">{companyName}</p>
                  {job.poster?.headline && <p className="mt-1 text-xs text-muted-foreground font-sans">{job.poster.headline}</p>}

                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground font-sans">
                    <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {job.location || "Remoto"}</span>
                    <span className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> {job.modality || "Modalidad flexible"}</span>
                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {job.type || "Tiempo completo"}</span>
                    <span className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" /> {salary}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-border rounded-2xl p-7 lg:p-8 space-y-7">
              <section>
                <h2 className="font-display text-xl font-bold mb-3">Sobre el rol</h2>
                <p className="text-sm leading-relaxed text-muted-foreground font-sans">
                  {job.description || "La empresa compartirá más detalles durante el proceso."}
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-bold mb-3">Requisitos clave</h2>
                {requirementItems.length > 0 ? (
                  <ul className="space-y-2 text-sm text-muted-foreground font-sans">
                    {requirementItems.slice(0, 8).map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground/70" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground font-sans">La empresa evaluará tu perfil según experiencia, skills y motivación.</p>
                )}
              </section>

              <section>
                <h2 className="font-display text-xl font-bold mb-3">Skills requeridas</h2>
                <div className="flex flex-wrap gap-2">
                  {(skills.length > 0 ? skills : ["Comunicación", "Trabajo en equipo", "Resolución de problemas"]).slice(0, 10).map((skill) => (
                    <span key={skill} className="text-xs font-medium px-3 py-1.5 rounded-full bg-primary/15 font-sans">{skill}</span>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="font-display text-xl font-bold mb-3">Beneficios y condiciones</h2>
                {benefitItems.length > 0 ? (
                  <ul className="space-y-2 text-sm text-muted-foreground font-sans">
                    {benefitItems.slice(0, 8).map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground/70" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground font-sans">Compensación, modalidad y condiciones se validan durante el proceso.</p>
                )}
              </section>

              <section>
                <h2 className="font-display text-xl font-bold mb-3">Proceso recomendado</h2>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-border p-4">
                    <p className="text-xs font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Paso 1</p>
                    <p className="mt-1 text-sm font-subtitle font-semibold">Aplica con CV y carta</p>
                  </div>
                  <div className="rounded-xl border border-border p-4">
                    <p className="text-xs font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Paso 2</p>
                    <p className="mt-1 text-sm font-subtitle font-semibold">Screening y validación</p>
                  </div>
                  <div className="rounded-xl border border-border p-4">
                    <p className="text-xs font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Paso 3</p>
                    <p className="mt-1 text-sm font-subtitle font-semibold">Entrevista final</p>
                  </div>
                </div>
              </section>

              {relatedJobs.length > 0 && (
                <section>
                  <h2 className="font-display text-xl font-bold mb-3">Más vacantes de {companyName}</h2>
                  <div className="grid md:grid-cols-2 gap-3">
                    {relatedJobs.map((related) => (
                      <Link key={related.id} to={buildDetailRoute(related.id)} className="rounded-xl border border-border p-4 hover:border-foreground transition-colors">
                        <p className="text-sm font-subtitle font-semibold line-clamp-1">{related.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground font-sans line-clamp-1">{related.location || "Remoto"} · {related.modality || "Flexible"}</p>
                        <p className="mt-2 text-xs font-subtitle font-semibold">{formatCompactSalary(related.salaryMin, related.salaryMax, related.salaryCurrency || "USD")}</p>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 self-start">
            {isAuthenticated && (
              <div className="rounded-2xl p-6 bg-foreground text-background">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-background/70 font-subtitle mb-4">
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> Tu match con IA
                </div>
                <div className="flex justify-center">
                  <AIMatchBadge jobId={job.id} size="lg" />
                </div>
                <p className="mt-4 text-xs text-background/70 font-sans text-center">
                  Análisis inteligente de compatibilidad entre tu perfil y esta vacante.
                </p>
              </div>
            )}

            <div className="bg-white border border-border rounded-2xl p-6 space-y-3">
              <Button
                className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 rounded-xl font-subtitle font-semibold"
                onClick={() => {
                  if (!isAuthenticated) {
                    requestLogin("Inicia sesión para postularte a esta vacante");
                    return;
                  }
                  if (hasApplied) {
                    toast.info("Ya aplicaste a esta vacante");
                    return;
                  }
                  applyMutation.mutate(job.id);
                }}
                disabled={applyMutation.isPending || hasApplied}
              >
                {applyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : hasApplied ? "Ya aplicaste" : "Postularme"}
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className={`rounded-xl font-subtitle ${saved ? "text-primary border-primary/40" : ""}`}
                  onClick={() => {
                    if (!isAuthenticated) {
                      requestLogin("Inicia sesión para guardar vacantes");
                      return;
                    }
                    const next = toggleSaveJob({
                      id: job.id,
                      title: job.title,
                      company: companyName,
                      location: job.location || "Remoto",
                      modality: job.modality || "Flexible",
                      salary,
                    });
                    setSaved(next);
                    toast.success(next ? "Vacante guardada" : "Vacante removida de guardados");
                  }}
                >
                  <Bookmark className={`h-4 w-4 ${saved ? "fill-primary" : ""}`} /> {saved ? "Guardada" : "Guardar"}
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl font-subtitle"
                  onClick={async () => {
                    const shareUrl = window.location.href;
                    if (navigator.share) {
                      try {
                        await navigator.share({ title: job.title, url: shareUrl });
                        return;
                      } catch {
                        return;
                      }
                    }
                    await navigator.clipboard.writeText(shareUrl);
                    toast.success("Enlace copiado");
                  }}
                >
                  <Share2 className="h-4 w-4" /> Compartir
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center pt-2 font-sans">Publicado {postedAt}</p>
            </div>

            <div className="bg-white border border-border rounded-2xl p-6 space-y-4">
              <h3 className="font-subtitle font-semibold text-sm">Empresa</h3>
              <div className="flex items-center gap-3">
                <CompanyLogo initial={companyName.slice(0, 1).toUpperCase()} imageUrl={job.poster?.avatarUrl} size="sm" />
                <div>
                  <p className="text-sm font-subtitle font-semibold">{companyName}</p>
                  <p className="text-xs text-muted-foreground font-sans">{companyLocation}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-border p-3">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-subtitle font-semibold">Vacantes activas</p>
                  <p className="mt-1 text-lg font-display font-bold">{job.companyStats?.activeJobs ?? 0}</p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-subtitle font-semibold">Contrataciones</p>
                  <p className="mt-1 text-lg font-display font-bold">{job.companyStats?.hires ?? 0}</p>
                </div>
              </div>

              {job.poster?.bio && (
                <p className="text-xs text-muted-foreground leading-relaxed font-sans">{job.poster.bio}</p>
              )}

              <div className="space-y-2">
                {companyWebsite && (
                  <a href={companyWebsite} target="_blank" rel="noreferrer" className="text-xs font-subtitle font-semibold inline-flex items-center gap-1.5 underline underline-offset-4">
                    <Globe className="h-3.5 w-3.5" /> Sitio web
                  </a>
                )}
                {companyLinkedIn && (
                  <a href={companyLinkedIn} target="_blank" rel="noreferrer" className="text-xs font-subtitle font-semibold inline-flex items-center gap-1.5 underline underline-offset-4">
                    <Users className="h-3.5 w-3.5" /> LinkedIn
                  </a>
                )}
              </div>

              <div className="space-y-2">
                <Link to={companyDetailRoute} className="inline-block text-xs font-subtitle font-semibold underline underline-offset-4">Ver empresa →</Link>
              </div>
            </div>
          </aside>
        </div>
    </section>
  );

  const authDialog = (
    <LoginRequiredDialog
      open={authDialogOpen}
      onOpenChange={setAuthDialogOpen}
      description="Para postularte o guardar vacantes, primero inicia sesión."
      loginTo={loginTarget}
    />
  );

  if (isInAppRoute) {
    return (
      <>
        {content}
        {authDialog}
      </>
    );
  }

  return (
    <AppLayout>
      {content}
      {authDialog}
    </AppLayout>
  );
};

export default VacanteDetalle;
