import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  Briefcase,
  Building2,
  Clock3,
  ExternalLink,
  Globe,
  HeartHandshake,
  Laptop2,
  Linkedin,
  Loader2,
  MapPin,
  Sparkles,
  Users2,
} from "lucide-react";
import { PublicLayout as AppLayout } from "@/components/Layouts";
import { Button } from "@/components/ui/button";
import { CompanyLogo } from "@/components/Brand";
import { companiesApi } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface CompanyDetail {
  id: string;
  name: string;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  linkedinUrl?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  isVerified?: boolean;
  plan?: string;
  profileData?: Record<string, unknown> | null;
  createdAt?: string;
  stats?: {
    activeJobs: number;
    inProcess?: number;
    hires: number;
  };
  jobs?: JobItem[];
  companyProfile?: {
    industry?: string | null;
    companySize?: string | null;
    foundedYear?: number | null;
    teamSize?: string | null;
    specialties?: string[];
    cultureValues?: string[];
    benefits?: string[];
    companyOverview?: string | null;
    hiringEmail?: string | null;
  };
}

const formatCompactCount = (value: number) => {
  if (!Number.isFinite(value)) return "0";
  if (value >= 1000000) return `${(value / 1000000).toFixed(1).replace(/\.0$/, "")}M+`;
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k+`;
  return String(value);
};

type TabId = "overview" | "vacantes" | "tecnologias" | "cultura";

type TabItem = {
  id: TabId;
  label: string;
  badge?: string;
};

interface JobItem {
  id: string;
  title: string;
  location?: string | null;
  modality?: string | null;
  type?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  createdAt?: string;
  description?: string | null;
  requirements?: string | null;
  benefits?: string | null;
  category?: {
    name?: string | null;
  } | null;
  skills?: Array<{ skill?: { name?: string | null } | null }>;
}

const formatDateAgo = (iso?: string) => {
  if (!iso) return "Reciente";
  return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: es });
};

const formatSalary = (job: JobItem) => {
  if (!job.salaryMin && !job.salaryMax) return "Salario a convenir";
  const currency = job.salaryCurrency || "USD";
  const formatter = new Intl.NumberFormat("es-CO", { style: "currency", currency, maximumFractionDigits: 0 });

  if (job.salaryMin && job.salaryMax) {
    return `${formatter.format(job.salaryMin)} - ${formatter.format(job.salaryMax)}`;
  }

  if (job.salaryMin) return `Desde ${formatter.format(job.salaryMin)}`;
  return `Hasta ${formatter.format(job.salaryMax || 0)}`;
};

const splitTextList = (value?: string | null) => {
  if (!value) return [] as string[];
  return Array.from(
    new Set(
      value
        .split(/\n|,|\.|;|\|/)
        .map((item) => item.trim())
        .filter((item) => item.length >= 3)
    )
  );
};

const modalityLabel: Record<string, string> = {
  REMOTO: "Remoto",
  HIBRIDO: "Híbrido",
  PRESENCIAL: "Presencial",
};

const typeLabel: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contrato",
  INTERNSHIP: "Práctica",
  FREELANCE: "Freelance",
};

const EmpresaDetalle = () => {
  const location = useLocation();
  const { id } = useParams();
  const isInAppRoute = location.pathname.startsWith("/app/");
  const appRoleSegment = isInAppRoute ? location.pathname.split("/")[2] : "";

  const companiesRoute = (appRoleSegment === "estudiante" || appRoleSegment === "talento" || appRoleSegment === "empresa")
    ? `/app/${appRoleSegment}/empresas`
    : "/empresa";

  const buildVacancyDetailRoute = (jobId: string) => {
    if (appRoleSegment === "estudiante") return `/app/estudiante/vacantes/${jobId}`;
    if (appRoleSegment === "talento") return `/app/talento/vacantes/${jobId}`;
    if (appRoleSegment === "empresa") return `/app/empresa/vacantes/${jobId}`;
    return `/vacantes/${jobId}`;
  };

  const { data, isLoading, isError } = useQuery<CompanyDetail>({
    queryKey: ["company", id],
    queryFn: async () => {
      if (!id) throw new Error("missing id");
      const response = await companiesApi.get(id);
      const payload = response.data as CompanyDetail;
      return payload;
    },
    enabled: Boolean(id),
  });

  const { jobs = [] } = data || {};
  const companyProfile = data?.companyProfile || {};
  const hasCover = Boolean(data?.coverUrl);

  const technologies = useMemo(() => {
    const fromProfile = Array.isArray(companyProfile.specialties)
      ? companyProfile.specialties.filter((item): item is string => Boolean(item?.trim()))
      : [];

    const fromJobs = jobs.flatMap((job) =>
      Array.isArray(job.skills)
        ? job.skills
            .map((entry) => entry.skill?.name?.trim())
            .filter((name): name is string => Boolean(name))
        : []
    );

    return Array.from(new Set([...fromProfile, ...fromJobs])).slice(0, 16);
  }, [companyProfile.specialties, jobs]);

  const benefits = useMemo(() => {
    const fromProfile = Array.isArray(companyProfile.benefits)
      ? companyProfile.benefits.filter((item): item is string => Boolean(item?.trim()))
      : [];
    const fromJobs = jobs.flatMap((job) => splitTextList(job.benefits));
    return Array.from(new Set([...fromProfile, ...fromJobs])).slice(0, 12);
  }, [companyProfile.benefits, jobs]);

  const cultureValues = useMemo(
    () => (Array.isArray(companyProfile.cultureValues) ? companyProfile.cultureValues.filter((item): item is string => Boolean(item?.trim())) : []),
    [companyProfile.cultureValues]
  );

  const websiteHost = useMemo(() => {
    if (!data?.website) return null;
    try {
      return new URL(data.website).hostname.replace("www.", "");
    } catch {
      return data.website;
    }
  }, [data?.website]);

  const latestJobId = useMemo(() => jobs[0]?.id, [jobs]);
  const jobsListRoute = companiesRoute.replace("/empresas", appRoleSegment === "estudiante" ? "/practicas" : "/vacantes");

  const infoCards = useMemo(
    () => [
      { label: "Vacantes activas", value: String(data?.stats?.activeJobs ?? 0) },
      { label: "En proceso", value: String(data?.stats?.inProcess ?? 0) },
      { label: "Contrataciones", value: formatCompactCount(Number(data?.stats?.hires ?? 0)) },
      ...(companyProfile.foundedYear ? [{ label: "Fundación", value: String(companyProfile.foundedYear) }] : []),
    ],
    [companyProfile.foundedYear, data?.stats?.activeJobs, data?.stats?.hires, data?.stats?.inProcess]
  );

  const overviewPoints = useMemo(
    () => [
      companyProfile.teamSize ? `Equipo de hiring: ${companyProfile.teamSize}` : null,
      companyProfile.hiringEmail ? `Contacto de talento: ${companyProfile.hiringEmail}` : null,
      data?.createdAt ? `En Joblify desde ${new Date(data.createdAt).getFullYear()}` : null,
    ].filter((item): item is string => Boolean(item)),
    [companyProfile.teamSize, companyProfile.hiringEmail, data?.createdAt]
  );

  const tabs: TabItem[] = [
    { id: "overview", label: "Overview" },
    { id: "vacantes", label: "Vacantes", badge: String(jobs.length) },
    { id: "tecnologias", label: "Tecnologías" },
    { id: "cultura", label: "Cultura" },
  ];

  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const overviewRef = useRef<HTMLElement | null>(null);
  const vacanciesRef = useRef<HTMLElement | null>(null);
  const technologiesRef = useRef<HTMLElement | null>(null);
  const cultureRef = useRef<HTMLElement | null>(null);

  const sectionMap = useMemo<Record<TabId, RefObject<HTMLElement>>>(
    () => ({
      overview: overviewRef,
      vacantes: vacanciesRef,
      tecnologias: technologiesRef,
      cultura: cultureRef,
    }),
    []
  );

  const handleTabClick = (tab: TabId) => {
    setActiveTab(tab);
    sectionMap[tab].current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const entries = (Object.entries(sectionMap) as Array<[TabId, RefObject<HTMLElement>]>).map(([, ref]) => ref.current).filter(Boolean) as HTMLElement[];
    if (entries.length === 0) return;

    const observer = new IntersectionObserver(
      (items) => {
        const visible = items
          .filter((item) => item.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;
        const found = (Object.entries(sectionMap) as Array<[TabId, RefObject<HTMLElement>]>).find(([, ref]) => ref.current === visible.target);
        if (found) setActiveTab(found[0]);
      },
      { rootMargin: "-25% 0px -60% 0px", threshold: [0.2, 0.4, 0.6] }
    );

    entries.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [sectionMap]);

  const content = (
    <section className="max-w-[1240px] mx-auto px-6 lg:px-10 py-10 lg:py-12">
      <Link to={companiesRoute} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground font-subtitle font-semibold">
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver a empresas
      </Link>

        {isLoading && (
          <div className="mt-6 rounded-2xl border border-border bg-white p-6 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando empresa...
          </div>
        )}

        {isError && (
          <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
            No pudimos cargar la empresa. Intenta de nuevo.
          </div>
        )}

        {data && (
          <div className="mt-6 space-y-6">
            <div className="rounded-[12px] overflow-hidden border border-border bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
              {data.coverUrl ? (
                <div className="h-44 sm:h-60 relative">
                  <img src={data.coverUrl} alt={data.name} className="absolute inset-0 h-full w-full object-cover" />
                </div>
              ) : (
                <div className="h-44 sm:h-60 bg-gradient-to-r from-[#1B1F4D] via-[#3B2F7A] to-[#1F3D7A]" />
              )}

              <div className={`px-6 sm:px-8 pb-6 ${hasCover ? "-mt-10 sm:-mt-14" : "-mt-12 sm:-mt-16"}`}>
                <div className="rounded-[12px] border border-border bg-white p-4 sm:p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      <CompanyLogo imageUrl={data.avatarUrl || undefined} initial={data.name?.[0] || "E"} size="lg" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h1 className="font-display text-[32px] leading-tight font-bold text-[#1D1D1F] truncate">{data.name}</h1>
                          {data.isVerified && <BadgeCheck className="h-5 w-5 text-primary shrink-0" />}
                        </div>
                        <p className="mt-1 text-sm text-[#6E6E73] font-sans line-clamp-2">
                          {data.headline || companyProfile.companyOverview || "Empresa en crecimiento dentro del ecosistema Joblify."}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6E6E73] font-sans">
                          {data.location && (
                            <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {data.location}</span>
                          )}
                          {companyProfile.companySize && <span className="inline-flex items-center gap-1"><Users2 className="h-3.5 w-3.5" /> {companyProfile.companySize}</span>}
                          {companyProfile.industry && <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {companyProfile.industry}</span>}
                          {websiteHost && <span className="inline-flex items-center gap-1"><Globe className="h-3.5 w-3.5" /> {websiteHost}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      {data.website && (
                        <Button asChild variant="outline" className="h-10 rounded-[980px] px-4 font-subtitle font-semibold">
                          <a href={data.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2">
                            Visitar sitio web <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      )}
                      {latestJobId && (
                        <Button asChild className="h-10 rounded-[980px] px-4 font-subtitle font-semibold">
                          <Link to={buildVacancyDetailRoute(latestJobId)}>Ver vacantes</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className={`mt-4 rounded-[12px] border border-border bg-[#F5F5F7] p-4 grid grid-cols-2 ${infoCards.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-3`}>
                  {infoCards.map((card) => (
                    <div key={card.label} className="rounded-[12px] border border-border bg-white p-3">
                      <p className="text-[10px] uppercase tracking-wider text-[#6E6E73] font-subtitle font-semibold">{card.label}</p>
                      <p className="mt-1 text-2xl font-display font-bold leading-none text-[#1D1D1F]">{card.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <nav className="border-b border-border flex flex-wrap items-center gap-5 text-sm font-subtitle">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabClick(tab.id)}
                  className={`inline-flex items-center gap-2 pb-3 border-b-2 transition-colors ${activeTab === tab.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                >
                  {tab.label}
                  {tab.badge && <span className="h-5 min-w-5 px-1 rounded-full bg-surface-elevated text-[10px] inline-flex items-center justify-center">{tab.badge}</span>}
                </button>
              ))}
            </nav>

            <section id="overview" ref={overviewRef} className="grid lg:grid-cols-[1.8fr_1fr] gap-4 scroll-mt-24">
              <article className="rounded-[12px] border border-border bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                <h2 className="font-subtitle font-semibold text-xl">Sobre {data.name}</h2>
                <p className="mt-3 text-sm text-[#6E6E73] font-sans leading-relaxed whitespace-pre-wrap">
                  {companyProfile.companyOverview || data.bio || "Sin descripción registrada en backend."}
                </p>

                {overviewPoints.length > 0 && (
                  <ul className="mt-4 space-y-2 text-sm text-[#6E6E73] font-sans">
                    {overviewPoints.map((point) => (
                      <li key={point} className="inline-flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-primary" /> {point}</li>
                    ))}
                  </ul>
                )}
              </article>

              <aside className="rounded-[12px] border border-border bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                <h3 className="font-subtitle font-semibold">Detalles de la empresa</h3>
                <div className="mt-4 space-y-3 text-sm font-sans">
                  <div>
                    <p className="text-[11px] text-[#6E6E73] uppercase tracking-wider">Industria</p>
                    <p>{companyProfile.industry || "No definida"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#6E6E73] uppercase tracking-wider">Tamaño de la empresa</p>
                    <p>{companyProfile.companySize || "No definido"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#6E6E73] uppercase tracking-wider">Ubicación</p>
                    <p>{data.location || "No definida"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#6E6E73] uppercase tracking-wider">Fundación</p>
                    <p>{companyProfile.foundedYear || "No definida"}</p>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-3">
                  {data.linkedinUrl && (
                    <a href={data.linkedinUrl} target="_blank" rel="noreferrer" aria-label="Abrir LinkedIn de la empresa" title="LinkedIn" className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-border hover:border-foreground">
                      <Linkedin className="h-4 w-4" />
                    </a>
                  )}
                  {data.website && (
                    <a href={data.website} target="_blank" rel="noreferrer" aria-label="Abrir sitio web de la empresa" title="Sitio web" className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-border hover:border-foreground">
                      <Globe className="h-4 w-4" />
                    </a>
                  )}
                </div>

                {(data.website || data.linkedinUrl || companyProfile.hiringEmail) && (
                  <div className="mt-5 pt-4 border-t border-border text-xs text-[#6E6E73] font-sans space-y-1">
                    {data.website && <p>Sitio web: {data.website}</p>}
                    {data.linkedinUrl && <p>LinkedIn: {data.linkedinUrl}</p>}
                    {companyProfile.hiringEmail && <p>Contacto talento: {companyProfile.hiringEmail}</p>}
                  </div>
                )}
              </aside>
            </section>

            <section id="tecnologias" ref={technologiesRef} className="rounded-[12px] border border-border bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] scroll-mt-24">
              <h3 className="font-subtitle font-semibold">Tecnologías</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {technologies.length > 0 ? technologies.map((tech) => (
                  <span key={tech} className="text-[11px] px-2.5 py-1 rounded-[980px] border border-border bg-[#F5F5F7]">
                    {tech}
                  </span>
                )) : <span className="text-sm text-muted-foreground">Sin tecnologías registradas en backend.</span>}
              </div>
            </section>

            <section id="cultura" ref={cultureRef} className="rounded-[12px] border border-border bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] scroll-mt-24">
              <h3 className="font-subtitle font-semibold">Beneficios</h3>
              {cultureValues.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs uppercase tracking-wider text-[#6E6E73] font-subtitle font-semibold">Valores culturales</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {cultureValues.map((value) => (
                      <span key={value} className="text-[11px] px-2.5 py-1 rounded-[980px] border border-border bg-[#F5F5F7]">
                        {value}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {benefits.map((benefit, index) => {
                  const Icon = index % 4 === 0 ? Laptop2 : index % 4 === 1 ? Clock3 : index % 4 === 2 ? BookOpen : HeartHandshake;
                  return (
                    <div key={benefit} className="rounded-[12px] border border-border bg-[#F5F5F7] p-3">
                      <Icon className="h-4 w-4 text-primary" />
                      <p className="mt-2 text-sm font-subtitle font-semibold">{benefit}</p>
                    </div>
                  );
                })}
              </div>

              {cultureValues.length === 0 && benefits.length === 0 && (
                <p className="mt-4 text-sm text-muted-foreground">Sin datos de cultura/beneficios registrados en backend.</p>
              )}
            </section>

            <section id="vacantes" ref={vacanciesRef} className="rounded-[12px] border border-border bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] scroll-mt-24">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-subtitle font-semibold text-xl">Vacantes activas</h2>
                <Link to={jobsListRoute} className="text-xs font-subtitle font-semibold text-primary hover:underline">Ver todas las vacantes</Link>
              </div>

              {jobs.length === 0 && (
                <div className="mt-4 rounded-xl border border-dashed border-border bg-surface-elevated/40 p-5 text-sm text-muted-foreground">
                  Esta empresa no tiene vacantes activas en este momento.
                </div>
              )}

              <div className="mt-4 grid md:grid-cols-2 gap-3">
                {jobs.map((job) => (
                  <article key={job.id} className="rounded-[12px] border border-border bg-[#FAFAFB] p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-sans">
                      <Sparkles className="h-3 w-3" /> Publicada {formatDateAgo(job.createdAt)}
                    </div>
                    <h3 className="font-subtitle font-semibold text-base leading-tight">{job.title}</h3>
                    <p className="text-xs text-muted-foreground font-sans">
                      {(job.modality && modalityLabel[job.modality]) || "Modalidad"} · {job.location || "Ubicación"}
                    </p>
                    <p className="text-sm text-muted-foreground font-sans line-clamp-2">
                      {job.description || "Sin descripción registrada"}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {splitTextList(job.requirements).slice(0, 4).map((tag) => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md bg-background border border-border">{tag}</span>
                      ))}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground inline-flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5" />
                      {(job.type && typeLabel[job.type]) || "Tipo no definido"}
                      <span className="mx-1">·</span>
                      {formatSalary(job)}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Button asChild variant="outline" className="h-9 rounded-[980px] font-subtitle font-semibold">
                        <Link to={buildVacancyDetailRoute(job.id)}>Ver vacante</Link>
                      </Button>
                      <Button asChild className="h-9 rounded-[980px] font-subtitle font-semibold">
                        <Link to={buildVacancyDetailRoute(job.id)}>Postular</Link>
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}
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

export default EmpresaDetalle;
