import { Search, MapPin, Briefcase, Loader2, Bookmark, SlidersHorizontal, X, Clock3, CircleDollarSign, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { CompanyLogo } from "@/components/Brand";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { aiApi, applicationsApi, jobsApi, savedApi } from "@/lib/api";
import { toast } from "sonner";

type JobSkill = { skill?: { name?: string } };

type JobApiItem = {
  id: string;
  title: string;
  description?: string;
  requirements?: string;
  location: string;
  modality: string;
  type?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  matchScore?: number;
  createdAt?: string;
  poster?: { name?: string; avatarUrl?: string; isVerified?: boolean };
  skills?: JobSkill[];
};

type ApplyError = { response?: { status?: number } };
type MyApplication = { id: string; jobId?: string };
type MatchResult = { score: number; reasons: string[]; gaps?: string[]; recommendation?: string };

const HIDDEN_MOCK_JOB_TITLES = ["senior product designer", "backend engineer (go)"];

const modalityOptions = ["REMOTO", "HIBRIDO", "PRESENCIAL"];
const typeOptions = ["FULL_TIME", "PART_TIME", "FREELANCE", "PASANTIA"];

const postedWithinOptions = [
  { value: "", label: "Cualquier fecha" },
  { value: "1", label: "Últimas 24 horas" },
  { value: "7", label: "Últimos 7 días" },
  { value: "30", label: "Últimos 30 días" },
];

const sortOptions = [
  { value: "recent", label: "Más recientes" },
  { value: "relevance", label: "Más relevantes" },
  { value: "salary_high", label: "Salario más alto" },
  { value: "salary_low", label: "Salario más bajo" },
  { value: "most_viewed", label: "Más vistas" },
];

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

const buildVacancyPreview = (description?: string, requirements?: string) => {
  const source = (description || requirements || "").replace(/\s+/g, " ").trim();
  if (!source) {
    return "Sin descripción registrada.";
  }
  return source.length > 170 ? `${source.slice(0, 170)}...` : source;
};

const formatPosted = (iso?: string) => {
  if (!iso) return "Reciente";
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 24) return `Publicado hace ${Math.max(hours, 1)} hora${hours === 1 ? "" : "s"}`;
  const days = Math.floor(hours / 24);
  return `Publicado hace ${days} día${days === 1 ? "" : "s"}`;
};

const TalentoVacantes = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [q, setQ] = useState(() => searchParams.get("q") ?? "");
  const [location, setLocation] = useState(() => searchParams.get("location") ?? "");
  const [modality, setModality] = useState(() => searchParams.get("modality") ?? "");
  const [contractType, setContractType] = useState(() => searchParams.get("type") ?? "");
  const [salaryMin, setSalaryMin] = useState(() => searchParams.get("salaryMin") ?? "");
  const [salaryMax, setSalaryMax] = useState(() => searchParams.get("salaryMax") ?? "");
  const [skillsInput, setSkillsInput] = useState(() => searchParams.get("skills") ?? "");
  const [postedWithinDays, setPostedWithinDays] = useState(() => searchParams.get("postedWithinDays") ?? "");
  const [sort, setSort] = useState(() => searchParams.get("sort") ?? "recent");
  const [showFilters, setShowFilters] = useState(false);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [analyzingJobId, setAnalyzingJobId] = useState<string | null>(null);
  const [aiMatches, setAiMatches] = useState<Record<string, MatchResult>>({});

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const skillsCsv = useMemo(
    () => skillsInput.split(",").map((skill) => skill.trim()).filter(Boolean).join(","),
    [skillsInput],
  );

  useEffect(() => {
    const nextParams = new URLSearchParams();
    if (q.trim()) nextParams.set("q", q.trim());
    if (location.trim()) nextParams.set("location", location.trim());
    if (modality) nextParams.set("modality", modality);
    if (contractType) nextParams.set("type", contractType);
    if (salaryMin.trim()) nextParams.set("salaryMin", salaryMin.trim());
    if (salaryMax.trim()) nextParams.set("salaryMax", salaryMax.trim());
    if (skillsCsv) nextParams.set("skills", skillsCsv);
    if (postedWithinDays) nextParams.set("postedWithinDays", postedWithinDays);
    if (sort && sort !== "recent") nextParams.set("sort", sort);

    const nextSerialized = nextParams.toString();
    const currentSerialized = searchParams.toString();
    if (nextSerialized !== currentSerialized) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [q, location, modality, contractType, salaryMin, salaryMax, skillsCsv, postedWithinDays, sort, searchParams, setSearchParams]);

  const hasAdvancedFilters = Boolean(
    location.trim() || modality || contractType || salaryMin.trim() || salaryMax.trim() || skillsCsv || postedWithinDays || sort !== "recent",
  );

  const activeFilterLabels = useMemo(() => {
    const labels: string[] = [];
    if (location.trim()) labels.push(`Ubicación: ${location.trim()}`);
    if (modality) labels.push(`Modalidad: ${modalityLabel[modality] || modality}`);
    if (contractType) labels.push(`Tipo: ${typeLabel[contractType] || contractType}`);
    if (salaryMin.trim()) labels.push(`Salario mín: ${salaryMin.trim()}`);
    if (salaryMax.trim()) labels.push(`Salario máx: ${salaryMax.trim()}`);
    if (skillsCsv) labels.push(`Skills: ${skillsCsv}`);
    if (postedWithinDays) {
      const dateOption = postedWithinOptions.find((option) => option.value === postedWithinDays);
      labels.push(`Publicado: ${dateOption?.label || postedWithinDays}`);
    }
    if (sort !== "recent") {
      const sortOption = sortOptions.find((option) => option.value === sort);
      labels.push(`Orden: ${sortOption?.label || sort}`);
    }
    return labels;
  }, [location, modality, contractType, salaryMin, salaryMax, skillsCsv, postedWithinDays, sort]);

  const clearAdvancedFilters = () => {
    setLocation("");
    setModality("");
    setContractType("");
    setSalaryMin("");
    setSalaryMax("");
    setSkillsInput("");
    setPostedWithinDays("");
    setSort("recent");
  };

  const { data: jobsData = [], isLoading } = useQuery<JobApiItem[]>({
    queryKey: ["jobs", "talento", q, location, modality, contractType, salaryMin, salaryMax, skillsCsv, postedWithinDays, sort],
    queryFn: async () => {
      const params: Record<string, string | number> = { limit: 30 };
      if (q.trim()) params.q = q.trim();
      if (location.trim()) params.location = location.trim();
      if (modality) params.modality = modality;
      if (contractType) params.type = contractType;
      if (salaryMin.trim()) params.salaryMin = salaryMin.trim();
      if (salaryMax.trim()) params.salaryMax = salaryMax.trim();
      if (skillsCsv) params.skills = skillsCsv;
      if (postedWithinDays) params.postedWithinDays = postedWithinDays;
      if (sort) params.sort = sort;

      const res = await jobsApi.list(params);
      return res.data?.jobs || [];
    },
  });

  const analyzeMatchMutation = useMutation({
    mutationFn: (jobId: string) => aiApi.match(jobId).then((res) => res.data as MatchResult),
    onMutate: (jobId) => {
      setAnalyzingJobId(jobId);
    },
    onSuccess: (result, jobId) => {
      setAiMatches((prev) => ({ ...prev, [jobId]: result }));
      toast.success("Match IA actualizado");
    },
    onError: () => {
      toast.error("No se pudo analizar el match con IA");
    },
    onSettled: () => {
      setAnalyzingJobId(null);
    },
  });

  const { data: savedJobs = [] } = useQuery<Array<{ id: string }>>({
    queryKey: ["saved", "jobs"],
    queryFn: () => savedApi.getJobs().then((res) => res.data),
  });

  const { data: myApplications = [] } = useQuery<MyApplication[]>({
    queryKey: ["applications", "my"],
    queryFn: () => applicationsApi.my().then((res) => res.data || []),
  });

  const appliedJobIds = new Set(myApplications.map((app) => app.jobId).filter((jobId): jobId is string => Boolean(jobId)));

  const applyMutation = useMutation({
    mutationFn: (jobId: string) => {
      setApplyingJobId(jobId);
      return applicationsApi.apply(jobId);
    },
    onSuccess: () => {
      toast.success("Aplicación enviada");
      queryClient.invalidateQueries({ queryKey: ["applications", "my"] });
    },
    onError: (error: unknown) => {
      if ((error as ApplyError)?.response?.status === 409) {
        toast.info("Ya aplicaste a esta vacante");
        return;
      }
      toast.error("No se pudo aplicar");
    },
    onSettled: () => {
      setApplyingJobId(null);
    },
  });

  const toggleSavedJob = useMutation({
    mutationFn: (jobId: string) => savedApi.toggleJob(jobId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["saved", "jobs"] });
      toast.success(res.data.saved ? "Vacante guardada" : "Vacante removida de guardados");
    },
    onError: () => toast.error("No se pudo actualizar guardados"),
  });

  const filteredJobs = jobsData
    .filter((j) => !HIDDEN_MOCK_JOB_TITLES.includes((j.title || "").toLowerCase()))
    .map((j) => ({
      id: j.id,
      title: j.title,
      preview: buildVacancyPreview(j.description, j.requirements),
      company: j.poster?.name || "Empresa",
      companyLogo: (j.poster?.name || "E").slice(0, 1).toUpperCase(),
      companyLogoUrl: j.poster?.avatarUrl,
      companyVerified: Boolean(j.poster?.isVerified),
      location: j.location,
      modality: j.modality,
      type: j.type || "FULL_TIME",
      salaryMin: typeof j.salaryMin === "number" ? j.salaryMin : null,
      salaryMax: typeof j.salaryMax === "number" ? j.salaryMax : null,
      salaryCurrency: j.salaryCurrency || "USD",
      skills: Array.isArray(j.skills)
        ? j.skills.map((s) => s.skill?.name).filter((name): name is string => Boolean(name))
        : [],
      match: j.matchScore || null,
      saved: savedJobs.some((savedJob) => savedJob.id === j.id),
      applied: appliedJobIds.has(j.id),
      postedAt: j.createdAt,
    }));

  return (
    <div>
      <PageHeader eyebrow="Explorar" title="Vacantes para ti" subtitle={`${filteredJobs.length} oportunidades alineadas con tu perfil.`} />

      <div className="rounded-2xl border border-border bg-card p-2 flex flex-wrap gap-2 mb-3">
        <div className="flex-1 min-w-[260px] flex items-center gap-2 px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cargo, empresa, skill..."
            className="flex-1 h-10 bg-transparent text-sm font-sans focus:outline-none"
          />
        </div>
        <button
          className={`h-10 px-4 rounded-xl border text-sm font-subtitle font-semibold inline-flex items-center gap-2 ${showFilters ? "border-foreground text-foreground" : "border-border text-muted-foreground"}`}
          onClick={() => setShowFilters((prev) => !prev)}
        >
          <SlidersHorizontal className="h-4 w-4" /> Filtros avanzados
        </button>
        {hasAdvancedFilters && (
          <button
            className="h-10 px-4 rounded-xl border border-border text-sm font-subtitle font-semibold inline-flex items-center gap-2 hover:border-foreground"
            onClick={clearAdvancedFilters}
          >
            <X className="h-4 w-4" /> Limpiar
          </button>
        )}
      </div>

      {showFilters && (
        <div className="mb-4 rounded-2xl border border-border bg-card p-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <label className="text-[11px] font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Ubicación</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Bogotá, Medellín, remoto"
              className="w-full h-10 rounded-xl border border-border px-3 text-sm font-sans bg-white"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="talento-filter-modality" className="text-[11px] font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Modalidad</label>
            <select
              id="talento-filter-modality"
              value={modality}
              onChange={(e) => setModality(e.target.value)}
              title="Filtrar por modalidad"
              aria-label="Filtrar por modalidad"
              className="w-full h-10 rounded-xl border border-border px-3 text-sm font-sans bg-white"
            >
              <option value="">Todas</option>
              {modalityOptions.map((option) => (
                <option key={option} value={option}>{modalityLabel[option]}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="talento-filter-type" className="text-[11px] font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Tipo</label>
            <select
              id="talento-filter-type"
              value={contractType}
              onChange={(e) => setContractType(e.target.value)}
              title="Filtrar por tipo de vacante"
              aria-label="Filtrar por tipo de vacante"
              className="w-full h-10 rounded-xl border border-border px-3 text-sm font-sans bg-white"
            >
              <option value="">Todos</option>
              {typeOptions.map((option) => (
                <option key={option} value={option}>{typeLabel[option]}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="talento-filter-posted" className="text-[11px] font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Publicado</label>
            <select
              id="talento-filter-posted"
              value={postedWithinDays}
              onChange={(e) => setPostedWithinDays(e.target.value)}
              title="Filtrar por fecha de publicación"
              aria-label="Filtrar por fecha de publicación"
              className="w-full h-10 rounded-xl border border-border px-3 text-sm font-sans bg-white"
            >
              {postedWithinOptions.map((option) => (
                <option key={option.value || "all"} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Salario mínimo</label>
            <input
              type="number"
              min="0"
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
              placeholder="Ej: 3500"
              className="w-full h-10 rounded-xl border border-border px-3 text-sm font-sans bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Salario máximo</label>
            <input
              type="number"
              min="0"
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
              placeholder="Ej: 8000"
              className="w-full h-10 rounded-xl border border-border px-3 text-sm font-sans bg-white"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Skills (separadas por coma)</label>
            <input
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="React, Node.js, SQL"
              className="w-full h-10 rounded-xl border border-border px-3 text-sm font-sans bg-white"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="talento-filter-sort" className="text-[11px] font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Ordenar por</label>
            <select
              id="talento-filter-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              title="Ordenar resultados"
              aria-label="Ordenar resultados"
              className="w-full h-10 rounded-xl border border-border px-3 text-sm font-sans bg-white"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {activeFilterLabels.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {activeFilterLabels.map((label) => (
            <span key={label} className="text-[11px] px-2.5 py-1 rounded-full bg-surface-elevated border border-border font-sans text-muted-foreground">
              {label}
            </span>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="py-12 flex justify-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="py-16 rounded-2xl border border-dashed border-border text-center bg-card">
          <p className="font-subtitle font-semibold">No encontramos vacantes con esos filtros</p>
          <p className="text-sm text-muted-foreground mt-1 font-sans">Prueba ajustar ubicación, salario o skills para ampliar resultados.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((j) => (
            <article key={j.id} className="p-5 rounded-2xl border border-border bg-card hover:border-foreground transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
              {aiMatches[j.id] && (
                <div className="mb-3 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
                  <p className="text-xs font-subtitle font-semibold text-primary">Match IA: {aiMatches[j.id].score}%</p>
                  {aiMatches[j.id].reasons?.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">{aiMatches[j.id].reasons.slice(0, 2).join(" · ")}</p>
                  )}
                  {aiMatches[j.id].gaps?.length ? (
                    <p className="text-[11px] text-muted-foreground mt-1">Brechas: {aiMatches[j.id].gaps?.slice(0, 2).join(", ")}</p>
                  ) : null}
                  {aiMatches[j.id].recommendation ? (
                    <p className="text-[11px] text-foreground/90 mt-1">{aiMatches[j.id].recommendation}</p>
                  ) : null}
                </div>
              )}

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <CompanyLogo initial={j.companyLogo} imageUrl={j.companyLogoUrl} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-subtitle font-semibold truncate">{j.company}</p>
                      {j.companyVerified && <ShieldCheck className="h-3.5 w-3.5 text-[#FFB100]" />}
                    </div>
                    {j.match && <p className="text-xs text-muted-foreground">{j.match}% match</p>}
                  </div>
                </div>

                <div className="rounded-lg bg-[#FDF7E7] px-3 py-1.5 text-right shrink-0">
                  <p className="text-sm font-subtitle font-semibold text-foreground">
                    {j.salaryMin && j.salaryMax ? `$${j.salaryMin} - $${j.salaryMax}` : "A convenir"}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase">{j.salaryCurrency} / mes</p>
                </div>
              </div>

              <h3 className="mt-3 font-subtitle font-semibold text-[30px] leading-tight tracking-tight">{j.title}</h3>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground font-sans">
                <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {j.location || "Ubicación flexible"}</span>
                <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {modalityLabel[j.modality] || j.modality}</span>
                <span className="inline-flex items-center gap-1"><CircleDollarSign className="h-3.5 w-3.5" /> {typeLabel[j.type] || j.type}</span>
                <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {formatPosted(j.postedAt)}</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {j.skills.slice(0, 6).map((s: string) => <span key={s} className="text-[11px] px-2.5 py-1 rounded-md border border-border bg-surface-elevated text-foreground/80 font-sans">{s}</span>)}
              </div>

              <p className="mt-2 text-sm text-muted-foreground font-sans max-w-4xl">{j.preview}</p>

              <div className="mt-4 pt-4 border-t border-border flex items-center justify-end">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="text-xs font-subtitle font-semibold px-3 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/5"
                    onClick={() => analyzeMatchMutation.mutate(j.id)}
                    disabled={Boolean(analyzingJobId)}
                  >
                    {analyzingJobId === j.id ? "Analizando IA..." : aiMatches[j.id] ? "Reanalizar IA" : "Analizar match IA"}
                  </button>
                  <button
                    className="text-xs font-subtitle font-semibold px-3 py-1.5 rounded-full border border-border hover:border-foreground"
                    onClick={() => navigate(`/app/talento/vacantes/${j.id}`)}
                  >
                    Ver detalle
                  </button>
                  <button
                    className={`text-xs font-subtitle font-semibold px-3 py-1.5 rounded-full border border-border hover:bg-surface-elevated inline-flex items-center gap-1.5 ${j.saved ? "text-primary border-primary/40" : "text-foreground"}`}
                    onClick={() => toggleSavedJob.mutate(j.id)}
                    disabled={toggleSavedJob.isPending}
                  >
                    <Bookmark className={`h-3.5 w-3.5 ${j.saved ? "fill-primary" : ""}`} />
                    {j.saved ? "Guardada" : "Guardar"}
                  </button>
                  <button
                    className="text-xs font-subtitle font-semibold px-3 py-1.5 rounded-full bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50"
                    onClick={() => {
                      if (j.applied) {
                        toast.info("Ya aplicaste a esta vacante");
                        return;
                      }
                      applyMutation.mutate(j.id);
                    }}
                    disabled={Boolean(applyingJobId) || j.applied}
                  >
                    {j.applied ? "Ya aplicaste" : applyingJobId === j.id ? "Aplicando..." : "Aplicar"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default TalentoVacantes;
