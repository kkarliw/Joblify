import { PageHeader } from "@/components/PageHeader";
import { Search, MapPin, Loader2, Building2, Briefcase, Users, ShieldCheck, Filter, ChevronDown, Bookmark, CircleDollarSign, Clock3, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CompanyLogo } from "@/components/Brand";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { aiApi, applicationsApi, jobsApi } from "@/lib/api";
import { toast } from "sonner";

type MatchResult = { score: number; reasons: string[]; gaps?: string[]; recommendation?: string };

type InternshipItem = {
  id: string;
  companyId: string;
  title: string;
  company: string;
  companyLogo?: string;
  companyVerified: boolean;
  recruiterName: string;
  modality: "REMOTO" | "HIBRIDO" | "PRESENCIAL";
  stipend: string;
  salaryMin: number;
  salaryMax: number;
  salaryCurrency: string;
  area: string;
  type: string;
  level: "junior" | "semi";
  skills: string[];
  preview: string;
  postedAt?: string;
  applyCount: number;
};

const moneyFormatter = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 0,
});

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

const buildVacancyPreview = (description?: string, requirements?: string) => {
  const source = (description || requirements || "").replace(/\s+/g, " ").trim();
  if (!source) {
    return "Sin descripción registrada.";
  }
  return source.length > 170 ? `${source.slice(0, 170)}...` : source;
};

const modalityLabel: Record<InternshipItem["modality"], string> = {
  REMOTO: "Remoto",
  HIBRIDO: "Híbrido",
  PRESENCIAL: "Presencial",
};

const inferLevel = (title: string): InternshipItem["level"] => {
  const normalized = title.toLowerCase();
  if (normalized.includes("semi") || normalized.includes("sr") || normalized.includes("senior")) return "semi";
  return "junior";
};

const Practicas = () => {
  const [q, setQ] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedModalities, setSelectedModalities] = useState<InternshipItem["modality"][]>([]);
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedTech, setSelectedTech] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<"" | InternshipItem["level"]>("");
  const [sort, setSort] = useState<"recent" | "stipend_high">("recent");
  const [salaryCap, setSalaryCap] = useState(2000000);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [analyzingJobId, setAnalyzingJobId] = useState<string | null>(null);
  const [aiMatches, setAiMatches] = useState<Record<string, MatchResult>>({});
  const queryClient = useQueryClient();

  const { data: internships = [], isLoading } = useQuery<InternshipItem[]>({
    queryKey: ["estudiante", "practicas", "feed"],
    queryFn: async () => {
      const response = await jobsApi.list({ limit: 80, sort: "recent" });
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
        .map((job) => {
          const salaryMin = Number(job.salaryMin || 0);
          const salaryMax = Number(job.salaryMax || 0);
          const salaryCurrency = String(job.salaryCurrency || "USD");
          const stipend = salaryMin > 0 || salaryMax > 0
            ? `${salaryMin > 0 ? `$${moneyFormatter.format(salaryMin)}` : "-"} · ${salaryMax > 0 ? `$${moneyFormatter.format(salaryMax)}` : "-"}`
            : "Compensación por definir";

          const poster = job.poster as { id?: string; name?: string; avatarUrl?: string; isVerified?: boolean } | undefined;
          const rawArea = Array.isArray(job.skills)
            ? String((job.skills[0] as { skill?: { name?: string } } | undefined)?.skill?.name || "General")
            : "General";
          const skills = Array.isArray(job.skills)
            ? job.skills
                .map((item) => String((item as { skill?: { name?: string } }).skill?.name || "").trim())
                .filter(Boolean)
            : [];

          const type = String(job.type || "PASANTIA");
          const normalizedType = type === "PASANTIA" ? "Pasantía" : type.replace("_", " ");
          const title = String(job.title || "Práctica");

          return {
            id: String(job.id || ""),
            companyId: String(poster?.id || ""),
            title,
            company: String(poster?.name || job.company || "Empresa"),
            companyLogo: poster?.avatarUrl,
            companyVerified: Boolean(poster?.isVerified),
            recruiterName: String(poster?.name || "Reclutador"),
            modality: (String(job.modality || "REMOTO") as InternshipItem["modality"]),
            stipend,
            salaryMin,
            salaryMax,
            salaryCurrency,
            area: rawArea,
            type: normalizedType,
            level: inferLevel(title),
            skills,
            preview: buildVacancyPreview(String(job.description || ""), String(job.requirements || "")),
            postedAt: String(job.createdAt || ""),
            applyCount: Number(job.applyCount || 0),
          };
        })
        .filter((job) => Boolean(job.id));
    },
  });

  const analyzeMatchMutation = useMutation({
    mutationFn: (jobId: string) => aiApi.match(jobId).then((res) => res.data as MatchResult),
    onMutate: (jobId) => {
      setAnalyzingJobId(jobId);
    },
    onSuccess: (result, jobId) => {
      setAiMatches((prev) => ({ ...prev, [jobId]: result }));
      toast.success("Match IA generado");
    },
    onError: () => toast.error("No se pudo generar el match IA"),
    onSettled: () => setAnalyzingJobId(null),
  });

  const applyMutation = useMutation({
    mutationFn: (jobId: string) => applicationsApi.applyWithDocuments({ jobId }),
    onMutate: (jobId) => {
      setApplyingJobId(jobId);
    },
    onSuccess: () => {
      toast.success("Postulación enviada");
      queryClient.invalidateQueries({ queryKey: ["applications", "my"] });
      setApplyingJobId(null);
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || "No se pudo aplicar";
      toast.error(message);
      setApplyingJobId(null);
    },
  });

  const maxAvailableSalary = useMemo(
    () => internships.reduce((max, item) => Math.max(max, item.salaryMax || item.salaryMin || 0), 0),
    [internships]
  );

  const salaryRangeMax = maxAvailableSalary > 0 ? maxAvailableSalary : 2000000;

  const typeCountMap = useMemo(() => {
    const map = new Map<string, number>();
    internships.forEach((item) => map.set(item.type, (map.get(item.type) || 0) + 1));
    return map;
  }, [internships]);

  const modalityCountMap = useMemo(() => {
    const map = new Map<InternshipItem["modality"], number>();
    internships.forEach((item) => map.set(item.modality, (map.get(item.modality) || 0) + 1));
    return map;
  }, [internships]);

  const areaOptions = useMemo(() => Array.from(new Set(internships.map((item) => item.area))).filter(Boolean), [internships]);
  const techOptions = useMemo(
    () => Array.from(new Set(internships.flatMap((item) => item.skills))).filter(Boolean).slice(0, 20),
    [internships]
  );

  const filtered = useMemo(() => {
    let list = internships.filter((item) => {
      const text = `${item.title} ${item.company} ${item.area} ${item.modality} ${item.skills.join(" ")}`.toLowerCase();
      if (q.trim() && !text.includes(q.trim().toLowerCase())) return false;
      if (selectedTypes.length > 0 && !selectedTypes.includes(item.type)) return false;
      if (selectedModalities.length > 0 && !selectedModalities.includes(item.modality)) return false;
      if (selectedArea && item.area !== selectedArea) return false;
      if (selectedTech && !item.skills.includes(selectedTech)) return false;
      if (selectedLevel && item.level !== selectedLevel) return false;

      if ((item.salaryMin > 0 || item.salaryMax > 0) && salaryCap > 0) {
        const compValue = item.salaryMax > 0 ? item.salaryMax : item.salaryMin;
        if (compValue > salaryCap) return false;
      }

      return true;
    });

    if (sort === "stipend_high") {
      list = [...list].sort((a, b) => (b.salaryMax || b.salaryMin) - (a.salaryMax || a.salaryMin));
    } else {
      list = [...list].sort((a, b) => (new Date(b.postedAt || 0).getTime() - new Date(a.postedAt || 0).getTime()));
    }

    return list;
  }, [internships, q, selectedTypes, selectedModalities, selectedArea, selectedTech, selectedLevel, salaryCap, sort]);

  const stats = useMemo(() => {
    const companies = new Map<string, { verified: boolean }>();
    internships.forEach((item) => {
      const key = item.companyId || item.company;
      companies.set(key, { verified: item.companyVerified });
    });

    const totalCompanies = companies.size;
    const verifiedCompanies = Array.from(companies.values()).filter((item) => item.verified).length;
    const verifiedPct = totalCompanies > 0 ? Math.round((verifiedCompanies / totalCompanies) * 100) : 0;

    return {
      active: internships.length,
      companies: totalCompanies,
      applications: internships.reduce((sum, item) => sum + item.applyCount, 0),
      verifiedPct,
    };
  }, [internships]);

  const toggleType = (type: string) => {
    setSelectedTypes((current) => (current.includes(type) ? current.filter((value) => value !== type) : [...current, type]));
  };

  const toggleModality = (modality: InternshipItem["modality"]) => {
    setSelectedModalities((current) =>
      current.includes(modality) ? current.filter((value) => value !== modality) : [...current, modality]
    );
  };

  const clearFilters = () => {
    setSelectedTypes([]);
    setSelectedModalities([]);
    setSelectedArea("");
    setSelectedTech("");
    setSelectedLevel("");
    setSalaryCap(salaryRangeMax);
  };

  const formatPosted = (iso?: string) => {
    if (!iso) return "Reciente";
    const diffMs = Date.now() - new Date(iso).getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    if (hours < 24) return `Publicado hace ${Math.max(hours, 1)} hora${hours === 1 ? "" : "s"}`;
    const days = Math.floor(hours / 24);
    return `Publicado hace ${days} día${days === 1 ? "" : "s"}`;
  };

  return (
    <div>
      <PageHeader
        eyebrow="Prácticas"
        title="Encuentra tu primera oportunidad"
        subtitle="Pasantías validadas, con remuneración y proceso claro."
        action={
          <div className="rounded-xl border border-border bg-card px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-4 min-w-[330px]">
            <div className="flex items-start gap-2">
              <Briefcase className="h-4 w-4 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-subtitle font-semibold">{stats.active}+</p>
                <p className="text-[11px] text-muted-foreground">Vacantes activas</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Building2 className="h-4 w-4 text-[#34C759] mt-0.5" />
              <div>
                <p className="text-sm font-subtitle font-semibold">{stats.companies}+</p>
                <p className="text-[11px] text-muted-foreground">Empresas</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Users className="h-4 w-4 text-[#FF9F0A] mt-0.5" />
              <div>
                <p className="text-sm font-subtitle font-semibold">{stats.applications}+</p>
                <p className="text-[11px] text-muted-foreground">Postulaciones</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-[#0071E3] mt-0.5" />
              <div>
                <p className="text-sm font-subtitle font-semibold">{stats.verifiedPct}%</p>
                <p className="text-[11px] text-muted-foreground">Verificadas</p>
              </div>
            </div>
          </div>
        }
      />

      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2 h-11">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por área, empresa o ciudad..." className="border-0 shadow-none focus-visible:ring-0 px-0" />
        </div>
        <button className="h-11 px-4 rounded-xl border border-border bg-card text-sm font-subtitle font-semibold inline-flex items-center gap-2">
          <Filter className="h-4 w-4" /> Filtros
        </button>
        <button
          className="h-11 px-4 rounded-xl border border-border bg-card text-sm font-subtitle font-semibold inline-flex items-center gap-2"
          onClick={() => setSort((current) => (current === "recent" ? "stipend_high" : "recent"))}
        >
          {sort === "recent" ? "Más recientes" : "Mayor remuneración"}
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando prácticas...
        </div>
      ) : (
        <div className="grid lg:grid-cols-[230px_1fr] gap-4">
          <aside className="rounded-2xl border border-border bg-card p-4 h-fit sticky top-20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-subtitle font-semibold text-sm">Filtros</h3>
              <button type="button" onClick={clearFilters} className="text-[11px] text-primary font-subtitle font-semibold">Limpiar</button>
            </div>

            <div className="space-y-4">
              <section>
                <p className="text-xs font-subtitle font-semibold mb-2">Tipo de empleo</p>
                <div className="space-y-2">
                  {Array.from(typeCountMap.entries()).map(([type, count]) => (
                    <label key={type} className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <input type="checkbox" checked={selectedTypes.includes(type)} onChange={() => toggleType(type)} />
                        {type}
                      </span>
                      <span>{count}</span>
                    </label>
                  ))}
                </div>
              </section>

              <section className="pt-3 border-t border-border">
                <p className="text-xs font-subtitle font-semibold mb-2">Modalidad</p>
                <div className="space-y-2">
                  {(["REMOTO", "HIBRIDO", "PRESENCIAL"] as InternshipItem["modality"][]).map((modality) => (
                    <label key={modality} className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <input type="checkbox" checked={selectedModalities.includes(modality)} onChange={() => toggleModality(modality)} />
                        {modalityLabel[modality]}
                      </span>
                      <span>{modalityCountMap.get(modality) || 0}</span>
                    </label>
                  ))}
                </div>
              </section>

              <section className="pt-3 border-t border-border">
                <p className="text-xs font-subtitle font-semibold mb-2">Salario mensual</p>
                <input
                  type="range"
                  min={0}
                  max={salaryRangeMax}
                  step={50000}
                  value={salaryCap}
                  onChange={(event) => setSalaryCap(Number(event.target.value))}
                  aria-label="Filtrar por salario mensual máximo"
                  title="Filtrar por salario mensual máximo"
                  className="w-full"
                />
                <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>$0</span>
                  <span>${moneyFormatter.format(salaryCap)}</span>
                </div>
              </section>

              <section className="pt-3 border-t border-border">
                <p className="text-xs font-subtitle font-semibold mb-2">Áreas</p>
                <select
                  value={selectedArea}
                  onChange={(event) => setSelectedArea(event.target.value)}
                  aria-label="Filtrar prácticas por área"
                  title="Filtrar prácticas por área"
                  className="h-9 w-full rounded-lg border border-border px-2 text-xs bg-white"
                >
                  <option value="">Todas las áreas</option>
                  {areaOptions.map((area) => <option key={area} value={area}>{area}</option>)}
                </select>
              </section>

              <section className="pt-3 border-t border-border">
                <p className="text-xs font-subtitle font-semibold mb-2">Tecnologías</p>
                <select
                  value={selectedTech}
                  onChange={(event) => setSelectedTech(event.target.value)}
                  aria-label="Filtrar prácticas por tecnología"
                  title="Filtrar prácticas por tecnología"
                  className="h-9 w-full rounded-lg border border-border px-2 text-xs bg-white"
                >
                  <option value="">Todas las tecnologías</option>
                  {techOptions.map((tech) => <option key={tech} value={tech}>{tech}</option>)}
                </select>
              </section>

              <section className="pt-3 border-t border-border">
                <p className="text-xs font-subtitle font-semibold mb-2">Nivel</p>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <label className="inline-flex items-center gap-2"><input type="radio" checked={selectedLevel === ""} onChange={() => setSelectedLevel("")} />Todos</label>
                  <label className="inline-flex items-center gap-2"><input type="radio" checked={selectedLevel === "junior"} onChange={() => setSelectedLevel("junior")} />Junior</label>
                  <label className="inline-flex items-center gap-2"><input type="radio" checked={selectedLevel === "semi"} onChange={() => setSelectedLevel("semi")} />Semi Senior</label>
                </div>
              </section>
            </div>
          </aside>

          <div className="space-y-3">
            {filtered.map((i) => (
              <article key={i.id} className="rounded-2xl border border-border bg-card p-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                {aiMatches[i.id] && (
                  <div className="mb-3 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
                    <p className="text-xs font-subtitle font-semibold text-primary">Match IA: {aiMatches[i.id].score}%</p>
                    {aiMatches[i.id].reasons?.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">{aiMatches[i.id].reasons.slice(0, 2).join(" · ")}</p>
                    )}
                    {aiMatches[i.id].recommendation ? (
                      <p className="text-[11px] text-foreground/90 mt-1">{aiMatches[i.id].recommendation}</p>
                    ) : null}
                  </div>
                )}

                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <CompanyLogo initial={i.company.slice(0, 1).toUpperCase()} imageUrl={i.companyLogo} size="sm" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-subtitle font-semibold truncate">{i.company}</p>
                        {i.companyVerified && <ShieldCheck className="h-3.5 w-3.5 text-[#FFB100]" />}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{i.area || "Industria"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 shrink-0">
                    <div className="rounded-lg bg-[#FDF7E7] px-3 py-1.5 text-right min-w-[118px]">
                      <p className="text-sm font-subtitle font-semibold text-foreground">{i.stipend.replace(" · ", " - ")}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{i.salaryCurrency} / mes</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSavedJobs((prev) => prev.includes(i.id) ? prev.filter((id) => id !== i.id) : [...prev, i.id])}
                      className="h-8 w-8 rounded-md border border-border inline-flex items-center justify-center hover:border-foreground"
                      title="Guardar vacante"
                    >
                      <Bookmark className={`h-4 w-4 ${savedJobs.includes(i.id) ? "fill-foreground" : ""}`} />
                    </button>
                  </div>
                </div>

                <h3 className="mt-3 font-subtitle font-semibold text-[34px] leading-[1.05] tracking-tight">{i.title}</h3>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground font-sans">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {modalityLabel[i.modality]}</span>
                  <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {i.type}</span>
                  <span className="inline-flex items-center gap-1"><CircleDollarSign className="h-3.5 w-3.5" /> Full time</span>
                  <span className="inline-flex items-center gap-1 text-[#34C759]"><span className="inline-block h-1.5 w-1.5 rounded-full bg-[#34C759]" /> <span className="text-muted-foreground">{formatPosted(i.postedAt)}</span></span>
                </div>

                {i.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {i.skills.slice(0, 6).map((skill) => (
                      <span key={skill} className="text-[11px] px-2.5 py-1 rounded-md border border-border bg-[#F5F5F7] text-foreground/80">{skill}</span>
                    ))}
                  </div>
                )}

                <p className="mt-2 text-sm text-muted-foreground font-sans max-w-4xl">{i.preview}</p>

                <footer className="mt-4 pt-3 border-t border-border flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => analyzeMatchMutation.mutate(i.id)}
                    disabled={Boolean(analyzingJobId)}
                    className="h-9 px-4 rounded-full border border-primary/30 text-primary text-xs font-subtitle font-semibold hover:bg-primary/5 disabled:opacity-60"
                  >
                    {analyzingJobId === i.id ? "Analizando IA..." : aiMatches[i.id] ? "Reanalizar IA" : "Match IA"}
                  </button>
                  <Link to={`/app/estudiante/vacantes/${i.id}`} className="h-9 px-4 rounded-full text-xs font-subtitle font-semibold text-primary inline-flex items-center hover:underline">
                    Ver detalle
                  </Link>
                  <button
                    type="button"
                    onClick={() => applyMutation.mutate(i.id)}
                    disabled={Boolean(applyingJobId) || applyMutation.isPending}
                    className="h-9 px-4 rounded-full bg-[#111827] text-white text-xs font-subtitle font-semibold hover:bg-black disabled:opacity-60 inline-flex items-center gap-1.5"
                  >
                    {applyingJobId === i.id ? "Aplicando..." : "Aplicar ahora"}
                    {applyingJobId !== i.id && <Send className="h-3.5 w-3.5" />}
                  </button>
                </footer>
              </article>
            ))}

            {filtered.length === 0 && (
              <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
                No encontramos prácticas con ese criterio.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Practicas;
