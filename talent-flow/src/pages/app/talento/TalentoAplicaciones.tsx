import { Clock3, CheckCircle2, XCircle, Eye, Loader2, ChevronDown, CalendarDays, ArrowRight, MoreVertical, ListChecks, Sparkles, Circle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { CompanyLogo } from "@/components/Brand";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { aiApi, applicationsApi } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { useMemo, useState } from "react";

type ApplicationStatus = "APLICADO" | "SCREENING" | "ENTREVISTA" | "OFERTA" | "CONTRATADO" | "RECHAZADO";

type TimelineEvent = {
  id: string;
  type?: string;
  title?: string;
  body?: string;
  createdAt?: string;
  metadata?: {
    status?: ApplicationStatus;
    interviewModeLabel?: string;
    scheduledAt?: string;
    timezone?: string;
    location?: string;
    meetingLink?: string;
    companyDisplayName?: string;
    companyLogoUrl?: string;
  };
};

type TalentApplication = {
  id: string;
  status: string;
  createdAt?: string;
  aiExplanation?: string;
  timeline?: TimelineEvent[];
  job?: {
    title?: string;
    poster?: { name?: string; avatarUrl?: string };
  };
};

const statusOrder: ApplicationStatus[] = ["APLICADO", "SCREENING", "ENTREVISTA", "OFERTA", "CONTRATADO"];

const statusLabel: Record<string, string> = {
  APLICADO: "Aplicado",
  SCREENING: "Screening",
  ENTREVISTA: "Entrevista",
  OFERTA: "Oferta",
  CONTRATADO: "Contratado",
  RECHAZADO: "Rechazada",
};

const statusColor: Record<string, string> = {
  APLICADO: "bg-amber-500/15 text-amber-700",
  SCREENING: "bg-blue-500/15 text-blue-700",
  ENTREVISTA: "bg-primary text-primary-foreground",
  OFERTA: "bg-emerald-500/15 text-emerald-700",
  CONTRATADO: "bg-emerald-500/20 text-emerald-800",
  RECHAZADO: "bg-rose-500/15 text-rose-700",
};

const metricCardMeta = {
  Total: {
    subtitle: "Todas tus postulaciones",
    iconWrap: "bg-[#EEF2FF] text-[#4F46E5]",
  },
  "En proceso": {
    subtitle: "Postulaciones activas",
    iconWrap: "bg-[#FFF7E8] text-[#F59E0B]",
  },
  Ofertas: {
    subtitle: "Ofertas recibidas",
    iconWrap: "bg-[#ECFDF3] text-[#22C55E]",
  },
  Rechazadas: {
    subtitle: "Postulaciones rechazadas",
    iconWrap: "bg-[#FDF2F8] text-[#E11D48]",
  },
} as const;

const formatShortDate = (iso?: string) => {
  if (!iso) return "Pendiente";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Pendiente";
  return date.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
};

const maybeStatusFromText = (value?: string): ApplicationStatus | null => {
  if (!value) return null;
  const upper = value.toUpperCase();

  if (upper.includes("RECHAZ") || upper.includes("REJECT")) return "RECHAZADO";
  if (upper.includes("CONTRAT") || upper.includes("HIRED")) return "CONTRATADO";
  if (upper.includes("OFERTA") || upper.includes("OFFER")) return "OFERTA";
  if (upper.includes("ENTREV") || upper.includes("INTERVIEW")) return "ENTREVISTA";
  if (upper.includes("SCREEN") || upper.includes("REVIEW") || upper.includes("PRE_INTERVIEW")) return "SCREENING";
  if (upper.includes("APLIC") || upper.includes("APPLIED")) return "APLICADO";

  return null;
};

const normalizeStatus = (value?: string): ApplicationStatus => maybeStatusFromText(value) || "APLICADO";

const deriveApplicationProgress = (statusValue?: string, timeline: TimelineEvent[] = []) => {
  const detectedStatuses: ApplicationStatus[] = [normalizeStatus(statusValue)];

  timeline.forEach((event) => {
    const fromMetadata = maybeStatusFromText(event.metadata?.status);
    const fromType = maybeStatusFromText(event.type);
    const fromTitle = maybeStatusFromText(event.title);

    if (fromMetadata) detectedStatuses.push(fromMetadata);
    if (fromType) detectedStatuses.push(fromType);
    if (fromTitle) detectedStatuses.push(fromTitle);
  });

  const hasRejected = detectedStatuses.includes("RECHAZADO");
  const nonRejected = detectedStatuses.filter((status) => status !== "RECHAZADO");
  const furthestStatus =
    nonRejected.sort((a, b) => statusOrder.indexOf(b) - statusOrder.indexOf(a))[0] || "APLICADO";

  return {
    badgeStatus: hasRejected ? "RECHAZADO" : furthestStatus,
    currentStageIndex: Math.max(statusOrder.indexOf(furthestStatus), 0),
  };
};

const TalentoAplicaciones = () => {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "oldest">("recent");
  const [coachingByApplication, setCoachingByApplication] = useState<Record<string, string>>({});
  const [coachingApplicationId, setCoachingApplicationId] = useState<string | null>(null);

  const { data: apps = [], isLoading } = useQuery<TalentApplication[]>({
    queryKey: ["applications", "my"],
    queryFn: () => applicationsApi.my().then((res) => res.data || []),
  });

  const withdrawMutation = useMutation({
    mutationFn: (applicationId: string) => applicationsApi.withdraw(applicationId),
    onSuccess: () => {
      toast.success("Postulación retirada");
      queryClient.invalidateQueries({ queryKey: ["applications", "my"] });
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || "No se pudo retirar la postulación";
      toast.error(message);
    },
  });

  const coachMutation = useMutation({
    mutationFn: async ({ applicationId, prompt }: { applicationId: string; prompt: string }) => {
      const res = await aiApi.chat(prompt, "career_advice");
      return { applicationId, reply: (res.data as { reply?: string }).reply || "" };
    },
    onMutate: ({ applicationId }) => {
      setCoachingApplicationId(applicationId);
    },
    onSuccess: ({ applicationId, reply }) => {
      if (!reply.trim()) {
        toast.error("La IA no devolvió sugerencias para esta postulación");
        return;
      }
      setCoachingByApplication((prev) => ({ ...prev, [applicationId]: reply.trim() }));
      toast.success("Consejo IA generado");
    },
    onError: () => {
      toast.error("No se pudo generar consejo IA");
    },
    onSettled: () => {
      setCoachingApplicationId(null);
    },
  });

  const visualApps = useMemo(
    () =>
      apps.map((application) => {
        const timeline = Array.isArray(application.timeline) ? application.timeline : [];
        const progress = deriveApplicationProgress(application.status, timeline);

        return {
          ...application,
          timeline,
          progress,
        };
      }),
    [apps]
  );

  const stats = [
    { label: "Total", value: visualApps.length, icon: Eye },
    {
      label: "En proceso",
      value: visualApps.filter((a) => ["APLICADO", "SCREENING", "ENTREVISTA"].includes(a.progress.badgeStatus)).length,
      icon: Clock3,
    },
    { label: "Ofertas", value: visualApps.filter((a) => a.progress.badgeStatus === "OFERTA").length, icon: CheckCircle2 },
    { label: "Rechazadas", value: visualApps.filter((a) => a.progress.badgeStatus === "RECHAZADO").length, icon: XCircle },
  ];

  const sortedApps = useMemo(() => {
    const list = [...visualApps];
    list.sort((a, b) => {
      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();
      return sortBy === "recent" ? bTime - aTime : aTime - bTime;
    });
    return list;
  }, [sortBy, visualApps]);

  return (
    <div>
      <PageHeader eyebrow="Mis aplicaciones" title="Seguimiento de procesos" subtitle="Estado actualizado en tiempo real de cada postulación." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => {
          const meta = metricCardMeta[s.label as keyof typeof metricCardMeta];
          return (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
              <div className={`h-10 w-10 rounded-xl inline-flex items-center justify-center ${meta.iconWrap}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div className="mt-3">
                <p className="font-display text-[34px] leading-none font-bold">{s.value}</p>
                <p className="text-sm font-subtitle font-semibold mt-1">{s.label}</p>
                <p className="text-xs text-muted-foreground font-sans mt-1">{meta.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between mb-3 gap-3">
        <h2 className="font-subtitle font-semibold text-2xl">Mis postulaciones</h2>
        <button
          type="button"
          onClick={() => setSortBy((prev) => (prev === "recent" ? "oldest" : "recent"))}
          className="h-10 px-4 rounded-xl border border-border bg-card text-sm font-subtitle font-semibold inline-flex items-center gap-2"
        >
          {sortBy === "recent" ? "Más recientes" : "Más antiguas"}
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 md:p-5">
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ul className="space-y-4">
            {sortedApps.map((a) => {
              const companyName = a.job?.poster?.name || "Empresa";
              const title = a.job?.title || "Vacante";
              const date = a.createdAt
                ? formatDistanceToNow(new Date(a.createdAt), { addSuffix: true, locale: es })
                : "Reciente";
              const status = a.progress.badgeStatus;
              const currentStageIndex = a.progress.currentStageIndex;
              const timeline = a.timeline;

              return (
                <li key={a.id} className="rounded-2xl border border-border p-4 md:p-5 transition-all duration-200 hover:shadow-[0_8px_28px_-16px_rgba(0,0,0,0.2)] hover:border-foreground/30">
                  <div className="flex items-start gap-4">
                    <CompanyLogo
                      initial={companyName.slice(0, 1).toUpperCase()}
                      imageUrl={a.job?.poster?.avatarUrl}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0 flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-2xl font-subtitle font-semibold truncate leading-tight">{title}</p>
                        <p className="text-sm text-muted-foreground font-sans truncate">{companyName} · {date}</p>
                      </div>

                      <div className="inline-flex items-center gap-2">
                        <span className={`text-[11px] font-subtitle font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full ${statusColor[status] || "bg-muted text-foreground"}`}>
                          {statusLabel[status] || status}
                        </span>
                        {status !== "CONTRATADO" && (
                          <button
                            type="button"
                            onClick={() => withdrawMutation.mutate(a.id)}
                            disabled={withdrawMutation.isPending}
                            className="h-10 px-4 rounded-xl border border-border text-sm font-subtitle font-semibold hover:bg-surface-elevated disabled:opacity-50"
                          >
                            Retirar postulación
                          </button>
                        )}
                        <button
                          type="button"
                          aria-label="Más acciones de la postulación"
                          title="Más acciones"
                          className="h-10 w-10 rounded-xl border border-border inline-flex items-center justify-center"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-border bg-background/60 p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                      {statusOrder.map((step, index) => {
                        const reached = currentStageIndex >= index;
                        const isCurrent = currentStageIndex === index;

                        return (
                          <div key={`${a.id}-${step}`} className={`rounded-lg border px-3 py-2 ${isCurrent ? "border-primary/40 bg-primary/5" : "border-border bg-white"}`}>
                            <div className="inline-flex items-center gap-2">
                              <span className={`h-5 w-5 rounded-full border inline-flex items-center justify-center ${reached ? "border-[#34C759] bg-[#ECFDF3]" : "border-border bg-white"}`}>
                                {reached ? <CheckCircle2 className="h-3.5 w-3.5 text-[#34C759]" /> : <Circle className="h-3 w-3 text-muted-foreground" />}
                              </span>
                              <p className={`text-[11px] font-subtitle uppercase tracking-wider ${reached ? "text-foreground" : "text-muted-foreground"}`}>{statusLabel[step] || step}</p>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1 ml-7">
                              {reached && step === "APLICADO" ? formatShortDate(a.createdAt) : reached ? "Completo" : "Pendiente"}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                      <p className="text-sm text-muted-foreground inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Aplicaste el {formatShortDate(a.createdAt)}</p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="text-xs font-subtitle font-semibold px-3 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/5"
                          onClick={() => {
                            const timelineSummary = timeline
                              .slice(0, 4)
                              .map((event) => `${event.title || event.type || "Evento"}: ${event.body || "sin detalle"}`)
                              .join(" | ");
                            const prompt = `Dame un consejo breve y accionable para mejorar mi candidatura en esta postulación.\nVacante: ${title}\nEmpresa: ${companyName}\nEstado actual: ${statusLabel[status] || status}\nTimeline: ${timelineSummary || "Sin eventos aún"}`;
                            coachMutation.mutate({ applicationId: a.id, prompt });
                          }}
                          disabled={Boolean(coachingApplicationId)}
                        >
                          {coachingApplicationId === a.id ? "Generando consejo..." : "Consejo IA"}
                        </button>
                        <button
                          type="button"
                          className="text-sm font-subtitle font-semibold text-primary inline-flex items-center gap-1"
                          onClick={() => setExpandedId((prev) => (prev === a.id ? null : a.id))}
                        >
                          {expandedId === a.id ? "Ocultar línea de tiempo" : "Ver línea de tiempo completa"} <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {coachingByApplication[a.id] && (
                      <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
                        <p className="text-xs font-subtitle font-semibold text-primary">Coach IA</p>
                        <p className="text-sm text-foreground/90 mt-1">{coachingByApplication[a.id]}</p>
                      </div>
                    )}

                    {a.aiExplanation && (
                      <div className="mt-3 rounded-xl border border-border bg-white p-3">
                        <p className="text-xs font-subtitle font-semibold text-foreground">Feedback IA del proceso</p>
                        <p className="text-sm text-muted-foreground mt-1">{a.aiExplanation}</p>
                      </div>
                    )}

                    {expandedId === a.id && (
                      <div className="mt-3 rounded-xl border border-border p-3 bg-background/60 transition-all duration-200">
                        {timeline.length === 0 ? (
                          <p className="text-xs text-muted-foreground">Aún no hay eventos registrados.</p>
                        ) : (
                          <ul className="space-y-3">
                            {timeline.map((event) => (
                              <li key={event.id} className="text-xs font-sans rounded-lg border border-border bg-card px-3 py-2">
                                <p className="font-subtitle text-foreground">{event.title || "Actualización"}</p>
                                {event.body && <p className="text-muted-foreground">{event.body}</p>}
                                {event.metadata?.scheduledAt && (
                                  <div className="mt-1 text-muted-foreground">
                                    <p>
                                      Entrevista {event.metadata?.interviewModeLabel || ""} · {new Date(event.metadata.scheduledAt).toLocaleString("es-CO")}
                                    </p>
                                    {event.metadata.location && <p>Dirección: {event.metadata.location}</p>}
                                    {event.metadata.meetingLink && <p>Link: {event.metadata.meetingLink}</p>}
                                  </div>
                                )}
                                {event.createdAt && (
                                  <p className="text-[10px] text-muted-foreground mt-1">
                                    {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true, locale: es })}
                                  </p>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}

            {sortedApps.length === 0 && (
              <li className="p-8 text-center text-sm text-muted-foreground">Aún no has aplicado a vacantes.</li>
            )}
          </ul>
        )}
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-[linear-gradient(90deg,#F7F7FB_0%,#F5F3FF_100%)] p-5 flex items-center justify-between gap-4">
        <div className="inline-flex items-start gap-3">
          <span className="h-10 w-10 rounded-xl bg-[#EEF2FF] text-[#4F46E5] inline-flex items-center justify-center"><ListChecks className="h-5 w-5" /></span>
          <div>
            <p className="font-subtitle font-semibold">Consejo</p>
            <p className="text-sm text-muted-foreground">Sigue participando activamente. Muchas oportunidades pueden llegar cuando menos lo esperas.</p>
          </div>
        </div>
        <Sparkles className="h-5 w-5 text-[#7C3AED] shrink-0" />
      </section>
    </div>
  );
};

export default TalentoAplicaciones;
