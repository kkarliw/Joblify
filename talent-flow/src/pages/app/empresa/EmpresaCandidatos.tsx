import { Search, MessageSquare, Loader2, Filter, Download, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { aiApi, applicationsApi, jobsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type JobItem = {
  id: string;
  title: string;
};

type JobApplication = {
  id: string;
  status?: string;
  matchScore?: number | null;
  cvUrl?: string | null;
  recommendationLetterUrl?: string | null;
  applicant?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    headline?: string | null;
    location?: string | null;
    matchScore?: number | null;
    skills?: Array<{ skill?: { name?: string | null } | null }>;
  };
};

type RankedCandidate = {
  applicationId: string;
  jobId: string;
  applicantId: string;
  applicantName: string;
  avatarUrl?: string | null;
  headline: string;
  location: string;
  skills: string[];
  status: string;
  match: number;
  jobTitle: string;
  cvUrl?: string | null;
  recommendationLetterUrl?: string | null;
};

type CvAnalysis = {
  score: number;
  executiveSummary: string;
  strengths: string[];
  risks: string[];
  recommendation: "Avanzar" | "Considerar" | "No avanzar" | string;
  recommendationReason: string;
  rawText?: string;
};

const statusLabel: Record<string, string> = {
  APLICADO: "Aplicado",
  SCREENING: "Screening",
  ENTREVISTA: "Entrevista",
  OFERTA: "Oferta",
  CONTRATADO: "Contratado",
  RECHAZADO: "Rechazado",
};

const getMatch = (application: JobApplication) => {
  if (typeof application.matchScore === "number") return application.matchScore;
  if (typeof application.applicant?.matchScore === "number") return application.applicant.matchScore;
  return 0;
};

const buildFallbackAnalysis = (candidate: RankedCandidate, rawText?: string): CvAnalysis => {
  const score = Math.max(0, Math.min(100, Math.round(candidate.match)));
  const recommendation =
    score >= 80 ? "Avanzar" : score >= 60 ? "Considerar" : "No avanzar";

  const strengths = candidate.skills.length > 0
    ? candidate.skills.slice(0, 4).map((skill) => `Demuestra base técnica en ${skill}.`)
    : ["Tiene perfil profesional activo y postulación completa."];

  const risks = [
    ...(score < 70 ? ["El match general está por debajo del umbral recomendado para avance inmediato."] : []),
    ...(candidate.skills.length === 0 ? ["No hay skills declaradas, conviene validar stack en entrevista inicial."] : []),
  ];

  return {
    score,
    executiveSummary: `${candidate.applicantName} aplica a "${candidate.jobTitle}" con match ${score}%. Se sugiere ${recommendation.toLowerCase()} según ajuste técnico y señales del perfil actual.`,
    strengths,
    risks: risks.length > 0 ? risks : ["No se detectan brechas críticas con la información disponible."],
    recommendation,
    recommendationReason:
      recommendation === "Avanzar"
        ? "El perfil muestra compatibilidad alta para continuar a entrevista."
        : recommendation === "Considerar"
          ? "Conviene validar brechas clave antes de tomar decisión final."
          : "Se recomienda priorizar candidatos con mejor ajuste para esta vacante.",
    rawText,
  };
};

const EmpresaCandidatos = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [minMatch, setMinMatch] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("TODOS");
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analysisTitle, setAnalysisTitle] = useState("");
  const [analysisText, setAnalysisText] = useState("");
  const [analysisApplicationId, setAnalysisApplicationId] = useState<string | null>(null);
  const [analysisStructured, setAnalysisStructured] = useState<CvAnalysis | null>(null);

  const trackCvEvent = useMutation({
    mutationFn: ({ applicationId, event }: { applicationId: string; event: "viewed" | "downloaded" }) =>
      applicationsApi.trackCvEvent(applicationId, event),
    onSuccess: (_data, variables) => {
      toast.success(variables.event === "downloaded" ? "CV marcado como descargado" : "CV marcado como visto");
    },
    onError: () => {
      toast.error("No se pudo registrar el evento de CV");
    },
  });

  const saveAnalysisMutation = useMutation({
    mutationFn: ({ applicationId, analysis }: { applicationId: string; analysis: CvAnalysis }) =>
      applicationsApi.saveAnalysis(applicationId, {
        score: analysis.score,
        executiveSummary: analysis.executiveSummary,
        strengths: analysis.strengths,
        risks: analysis.risks,
        recommendation: analysis.recommendation,
        recommendationReason: analysis.recommendationReason,
        rawText: analysis.rawText,
      }),
    onSuccess: () => {
      toast.success("Análisis guardado en la postulación");
    },
    onError: () => {
      toast.error("No se pudo guardar el análisis");
    },
  });

  const parseAnalysis = (raw: string): CvAnalysis | null => {
    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    if (jsonStart < 0 || jsonEnd <= jsonStart) return null;

    try {
      const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as Partial<CvAnalysis>;
      if (
        typeof parsed.score !== "number" ||
        typeof parsed.executiveSummary !== "string" ||
        !Array.isArray(parsed.strengths) ||
        !Array.isArray(parsed.risks) ||
        typeof parsed.recommendation !== "string" ||
        typeof parsed.recommendationReason !== "string"
      ) {
        return null;
      }

      return {
        score: Math.max(0, Math.min(100, Math.round(parsed.score))),
        executiveSummary: parsed.executiveSummary,
        strengths: parsed.strengths.map(String),
        risks: parsed.risks.map(String),
        recommendation: parsed.recommendation,
        recommendationReason: parsed.recommendationReason,
        rawText: raw,
      };
    } catch {
      return null;
    }
  };

  const analyzeCvMutation = useMutation({
    mutationFn: (candidate: RankedCandidate) => {
      const prompt = [
        "Eres asistente de reclutamiento de Joblify. Analiza este perfil de candidato para la vacante indicada y responde SOLO JSON válido en español.",
        `Nombre: ${candidate.applicantName}`,
        `Cargo actual: ${candidate.headline}`,
        `Ubicación: ${candidate.location}`,
        `Skills: ${candidate.skills.join(", ") || "No registradas"}`,
        `Vacante: ${candidate.jobTitle}`,
        `Match actual: ${Math.round(candidate.match)}%`,
        "Devuelve este formato exacto:",
        "{",
        '  "score": 0-100,',
        '  "executiveSummary": "...",',
        '  "strengths": ["..."],',
        '  "risks": ["..."],',
        '  "recommendation": "Avanzar|Considerar|No avanzar",',
        '  "recommendationReason": "..."',
        "}",
      ].join("\n");

      return aiApi.chat(prompt, "recruiter", undefined, candidate.jobId);
    },
    onError: () => {
      toast.error("No se pudo analizar el CV con IA");
    },
  });

  const { data: rankedCandidates = [], isLoading } = useQuery<RankedCandidate[]>({
    queryKey: ["empresa", "candidatos", "ranked"],
    queryFn: async () => {
      const jobsResponse = await jobsApi.myPosted();
      const jobsPayload = jobsResponse.data;
      const jobs = Array.isArray(jobsPayload) ? (jobsPayload as JobItem[]) : [];

      if (jobs.length === 0) return [];

      const applicationsByJob = await Promise.all(
        jobs.map(async (job) => {
          const applicationsResponse = await applicationsApi.byJob(job.id);
          const applicationsPayload = applicationsResponse.data;
          const applications = Array.isArray(applicationsPayload) ? (applicationsPayload as JobApplication[]) : [];

          return applications
            .filter((application) => Boolean(application.applicant?.id && application.applicant?.name))
            .map((application) => {
              const skills = Array.isArray(application.applicant?.skills)
                ? application.applicant.skills
                    .map((entry) => entry.skill?.name)
                    .filter((name): name is string => Boolean(name))
                : [];

              return {
                applicationId: application.id,
                jobId: job.id,
                applicantId: application.applicant!.id,
                applicantName: application.applicant!.name,
                avatarUrl: application.applicant?.avatarUrl,
                headline: application.applicant?.headline || "Perfil profesional",
                location: application.applicant?.location || "Remoto",
                skills,
                status: application.status || "APLICADO",
                match: getMatch(application),
                jobTitle: job.title,
                cvUrl: application.cvUrl,
                recommendationLetterUrl: application.recommendationLetterUrl,
              } satisfies RankedCandidate;
            });
        })
      );

      return applicationsByJob
        .flat()
        .sort((a, b) => b.match - a.match);
    },
  });

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    
    return rankedCandidates.filter((candidate) => {
      // Text search
      if (query) {
        const searchable = [
          candidate.applicantName,
          candidate.headline,
          candidate.location,
          candidate.jobTitle,
          ...candidate.skills,
        ]
          .join(" ")
          .toLowerCase();

        if (!searchable.includes(query)) return false;
      }

      // Match score filter
      if (candidate.match < minMatch) return false;

      // Status filter
      if (statusFilter !== "TODOS" && candidate.status !== statusFilter) return false;

      return true;
    });
  }, [rankedCandidates, q, minMatch, statusFilter]);

  const exportToCSV = () => {
    const headers = ["Nombre", "Cargo", "Ubicación", "Match %", "Estado", "Vacante"];
    const rows = filtered.map(c => [
      c.applicantName,
      c.headline,
      c.location,
      Math.round(c.match),
      statusLabel[c.status] || c.status,
      c.jobTitle,
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `candidatos-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const resolveFileUrl = (url?: string | null) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
    const backendBase = apiBase.replace(/\/api\/?$/, "");
    return `${backendBase}${url.startsWith("/") ? url : `/${url}`}`;
  };

  const handleAnalyzeCv = (candidate: RankedCandidate) => {
    setAnalysisTitle(`Análisis IA · ${candidate.applicantName}`);
    setAnalysisText("");
    setAnalysisStructured(null);
    setAnalysisApplicationId(candidate.applicationId);
    setAnalysisOpen(true);

    analyzeCvMutation.mutate(candidate, {
      onSuccess: (response) => {
        const reply = (response.data as { reply?: string })?.reply?.trim();
        if (!reply) {
          const fallback = buildFallbackAnalysis(candidate);
          setAnalysisStructured(fallback);
          setAnalysisText("Análisis generado con fallback inteligente porque la IA no devolvió contenido.");
          toast.error("La IA no respondió; usamos análisis de respaldo");
          return;
        }
        setAnalysisText(reply);
        const structured = parseAnalysis(reply);
        if (structured) {
          setAnalysisStructured(structured);
          return;
        }

        const fallback = buildFallbackAnalysis(candidate, reply);
        setAnalysisStructured(fallback);
        toast.error("La IA devolvió formato inválido; usamos análisis de respaldo");
      },
    });
  };

  const handleCopyAnalysis = async () => {
    const source = analysisStructured
      ? `Score: ${analysisStructured.score}\nResumen: ${analysisStructured.executiveSummary}\nFortalezas: ${analysisStructured.strengths.join("; ")}\nRiesgos: ${analysisStructured.risks.join("; ")}\nRecomendación: ${analysisStructured.recommendation}\nMotivo: ${analysisStructured.recommendationReason}`
      : analysisText;

    if (!source.trim()) return;

    try {
      await navigator.clipboard.writeText(source);
      toast.success("Análisis copiado");
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  const handleSaveAnalysis = () => {
    if (!analysisStructured || !analysisApplicationId) {
      toast.error("No hay análisis estructurado para guardar");
      return;
    }
    saveAnalysisMutation.mutate({ applicationId: analysisApplicationId, analysis: analysisStructured });
  };

  return (
    <div>
      <PageHeader eyebrow="Talento" title="Candidatos rankeados" subtitle="Ranking IA basado en compatibilidad con tus vacantes activas." />

      <div className="space-y-3 mb-6">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 h-11 rounded-xl border border-border bg-card">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nombre, cargo, skill…" className="flex-1 bg-transparent text-sm font-sans focus:outline-none" />
          </div>
          <Button
            variant="outline"
            onClick={exportToCSV}
            disabled={filtered.length === 0}
            className="h-11 rounded-xl font-subtitle font-semibold"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-subtitle font-semibold text-muted-foreground">Filtros:</span>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="minMatch" className="text-xs font-sans text-muted-foreground">
              Match mínimo:
            </label>
            <select
              id="minMatch"
              value={minMatch}
              onChange={(e) => setMinMatch(Number(e.target.value))}
              className="h-8 px-2 rounded-lg border border-border bg-card text-xs font-sans focus:outline-none focus:border-primary"
            >
              <option value="0">Todos</option>
              <option value="60">60%+</option>
              <option value="70">70%+</option>
              <option value="80">80%+</option>
              <option value="90">90%+</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="statusFilter" className="text-xs font-sans text-muted-foreground">
              Estado:
            </label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 px-2 rounded-lg border border-border bg-card text-xs font-sans focus:outline-none focus:border-primary"
            >
              <option value="TODOS">Todos</option>
              <option value="APLICADO">Aplicado</option>
              <option value="SCREENING">Screening</option>
              <option value="ENTREVISTA">Entrevista</option>
              <option value="OFERTA">Oferta</option>
            </select>
          </div>

          <div className="ml-auto text-xs font-subtitle font-semibold text-muted-foreground">
            {filtered.length} candidato{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando candidatos...
        </div>
      ) : (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(c => (
          <div key={c.applicationId} className="rounded-2xl border border-border bg-card p-5 hover:border-foreground transition-colors">
            <div className="flex items-start justify-between">
              <div className="h-12 w-12 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-semibold">
                {c.avatarUrl ? (
                  <img src={c.avatarUrl} alt={c.applicantName} className="w-full h-full object-cover rounded-full" />
                ) : (
                  c.applicantName.split(" ").map(n => n[0]).slice(0, 2).join("")
                )}
              </div>
              <span className="text-xs font-subtitle font-semibold px-2.5 py-1 rounded-full bg-primary text-primary-foreground">{Math.round(c.match)}%</span>
            </div>
            <h3 className="mt-4 font-subtitle font-semibold text-sm">{c.applicantName}</h3>
            <p className="text-xs text-muted-foreground font-sans">{c.headline} · {c.location}</p>
            <p className="mt-1 text-[11px] text-muted-foreground font-sans">Postuló a: {c.jobTitle}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(c.skills.length > 0 ? c.skills : ["Sin skills registradas"]).slice(0, 4).map(s => (
                <span key={s} className="text-[10px] px-2 py-0.5 rounded-md bg-surface-elevated font-sans">{s}</span>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">{statusLabel[c.status] || c.status}</span>
                <span className="text-[10px] font-subtitle font-semibold text-muted-foreground">Match {Math.round(c.match)}%</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => navigate("/app/empresa/mensajes")}
                  className="h-9 px-3 rounded-lg bg-foreground text-background text-xs font-subtitle font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-foreground/90"
                >
                  <MessageSquare className="h-3 w-3" /> Contactar
                </button>
                <button
                  onClick={() => navigate(`/app/empresa/perfil/${c.applicantId}`)}
                  className="h-9 px-3 rounded-lg border border-border text-xs font-subtitle font-semibold inline-flex items-center justify-center gap-1.5 hover:border-foreground"
                >
                  Ver perfil
                </button>
                <button
                  onClick={() => {
                    const fileUrl = resolveFileUrl(c.cvUrl);
                    if (!fileUrl) {
                      toast.info("El candidato no adjuntó CV en esta postulación ni en su perfil");
                      return;
                    }
                    trackCvEvent.mutate({ applicationId: c.applicationId, event: "viewed" });
                    window.open(fileUrl, "_blank", "noopener,noreferrer");
                  }}
                  className="h-9 px-3 rounded-lg border border-border text-xs font-subtitle font-semibold inline-flex items-center justify-center gap-1.5 hover:border-foreground"
                >
                  Ver CV
                </button>
                <button
                  onClick={() => {
                    const fileUrl = resolveFileUrl(c.cvUrl);
                    if (!fileUrl) {
                      toast.info("El candidato no adjuntó CV en esta postulación ni en su perfil");
                      return;
                    }
                    trackCvEvent.mutate({ applicationId: c.applicationId, event: "downloaded" });
                    const link = document.createElement("a");
                    link.href = fileUrl;
                    link.download = `${c.applicantName.replace(/\s+/g, "_")}_cv.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="h-9 px-3 rounded-lg border border-border text-xs font-subtitle font-semibold inline-flex items-center justify-center gap-1.5 hover:border-foreground"
                >
                  Descargar CV
                </button>
              </div>

              <button
                onClick={() => handleAnalyzeCv(c)}
                className="w-full h-9 px-3 rounded-lg border border-primary/30 bg-primary/10 text-xs font-subtitle font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-primary/15"
              >
                <Sparkles className="h-3 w-3" /> Analizar CV con IA
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3 rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No hay candidatos para mostrar todavía.
          </div>
        )}
      </div>
      )}

      <Dialog open={analysisOpen} onOpenChange={setAnalysisOpen}>
        <DialogContent className="rounded-2xl sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-subtitle">{analysisTitle || "Análisis de CV"}</DialogTitle>
            <DialogDescription>
              Evaluación generada por el asistente de reclutamiento para apoyar tu decisión.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-border bg-surface-elevated/40 p-4">
            {analyzeCvMutation.isPending ? (
              <div className="py-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Analizando perfil...
              </div>
            ) : (
              <div className="space-y-4">
                {analysisStructured ? (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-lg border border-border bg-card p-3">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Score</p>
                        <p className="text-xl font-subtitle font-semibold">{analysisStructured.score}</p>
                      </div>
                      <div className="rounded-lg border border-border bg-card p-3 col-span-2">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Recomendación</p>
                        <p className="text-sm font-subtitle font-semibold">{analysisStructured.recommendation}</p>
                        <p className="text-xs text-muted-foreground mt-1">{analysisStructured.recommendationReason}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-subtitle font-semibold mb-1">Resumen ejecutivo</p>
                      <p className="text-sm text-foreground/90 font-sans leading-relaxed">{analysisStructured.executiveSummary}</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-subtitle font-semibold mb-1">Fortalezas</p>
                        <ul className="space-y-1">
                          {analysisStructured.strengths.map((item) => (
                            <li key={item} className="text-sm text-foreground/90">• {item}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-subtitle font-semibold mb-1">Riesgos / brechas</p>
                        <ul className="space-y-1">
                          {analysisStructured.risks.map((item) => (
                            <li key={item} className="text-sm text-foreground/90">• {item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm whitespace-pre-wrap text-foreground/90 font-sans leading-relaxed">
                    {analysisText || "Sin resultados todavía."}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={handleCopyAnalysis}>Copiar resumen</Button>
            <Button onClick={handleSaveAnalysis} disabled={!analysisStructured || saveAnalysisMutation.isPending}>
              {saveAnalysisMutation.isPending ? "Guardando..." : "Guardar análisis"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmpresaCandidatos;
