import { useEffect, useState, type DragEvent } from "react";
import { PageHeader } from "@/components/PageHeader";
import { GripVertical, Star, MessageSquare, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { applicationsApi, jobsApi } from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuthStore } from "@/store/authStore";

type ApplicationStage = "APLICADO" | "SCREENING" | "ENTREVISTA" | "OFERTA" | "CONTRATADO" | "RECHAZADO";

type JobItem = {
  id: string;
  title: string;
};

type JobApplication = {
  id: string;
  status?: ApplicationStage;
  matchScore?: number | null;
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

type PipelineCandidate = {
  applicationId: string;
  applicantId: string;
  name: string;
  avatarUrl?: string | null;
  headline: string;
  jobTitle: string;
  skills: string[];
  match: number;
  stage: ApplicationStage;
};

type UpdateStatusVariables = {
  id: string;
  status: ApplicationStage;
  previousStage: ApplicationStage;
  interview?: {
    mode: "REMOTO" | "PRESENCIAL";
    scheduledAt: string;
    timezone?: string;
    location?: string;
    meetingLink?: string;
    notes?: string;
  };
  sendEmail?: boolean;
  companyBranding?: {
    displayName?: string;
    logoUrl?: string;
  };
};

const stages: Array<{ id: ApplicationStage; label: string; dot: string }> = [
  { id: "APLICADO", label: "Nuevo", dot: "bg-info" },
  { id: "SCREENING", label: "Screening", dot: "bg-amber-500" },
  { id: "ENTREVISTA", label: "Entrevista", dot: "bg-violet-500" },
  { id: "OFERTA", label: "Oferta", dot: "bg-primary" },
  { id: "CONTRATADO", label: "Contratado", dot: "bg-emerald-500" },
  { id: "RECHAZADO", label: "Rechazado", dot: "bg-rose-500" },
] as const;

const stageLabel = Object.fromEntries(stages.map((stage) => [stage.id, stage.label])) as Record<ApplicationStage, string>;

const getMatch = (application: JobApplication) => {
  if (typeof application.matchScore === "number") return application.matchScore;
  if (typeof application.applicant?.matchScore === "number") return application.applicant.matchScore;
  return 0;
};

const EmpresaPipeline = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [items, setItems] = useState<PipelineCandidate[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<ApplicationStage | null>(null);
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [pendingInterviewMove, setPendingInterviewMove] = useState<UpdateStatusVariables | null>(null);
  const [interviewForm, setInterviewForm] = useState({
    mode: "REMOTO" as "REMOTO" | "PRESENCIAL",
    date: "",
    time: "",
    timezone: "America/Bogota",
    location: "",
    meetingLink: "",
    notes: "",
    sendEmail: true,
    companyDisplayName: user?.name || "",
    companyLogoUrl: user?.avatarUrl || "",
  });

  const { data: rankedApplications = [], isLoading } = useQuery<PipelineCandidate[]>({
    queryKey: ["empresa", "pipeline", "applications"],
    queryFn: async () => {
      const jobsResponse = await jobsApi.myPosted();
      const jobsPayload = jobsResponse.data;
      const jobs = Array.isArray(jobsPayload) ? (jobsPayload as JobItem[]) : [];

      if (jobs.length === 0) return [];

      const byJob = await Promise.all(
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
                applicantId: application.applicant!.id,
                name: application.applicant!.name,
                avatarUrl: application.applicant?.avatarUrl,
                headline: application.applicant?.headline || "Perfil profesional",
                jobTitle: job.title,
                skills,
                match: getMatch(application),
                stage: application.status || "APLICADO",
              } satisfies PipelineCandidate;
            });
        })
      );

      return byJob.flat().sort((a, b) => b.match - a.match);
    },
  });

  useEffect(() => {
    setItems(rankedApplications);
  }, [rankedApplications]);

  const updateStatus = useMutation({
    mutationFn: (variables: UpdateStatusVariables) =>
      applicationsApi.updateStatus(variables.id, {
        status: variables.status,
        notes: undefined,
        interview: variables.interview,
        sendEmail: variables.sendEmail,
        companyBranding: variables.companyBranding,
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["empresa", "pipeline", "applications"] });
      queryClient.invalidateQueries({ queryKey: ["empresa", "candidatos", "ranked"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });

      const payload = response?.data as { emailSent?: boolean; emailError?: string } | undefined;
      if (payload?.emailSent) {
        toast.success("Correo de entrevista enviado al candidato");
      } else if (payload?.emailError) {
        toast.error(payload.emailError);
      }
    },
    onError: (error: unknown, variables) => {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "No se pudo actualizar la etapa";
      toast.error(message);

      setItems((prev) =>
        prev.map((candidate) =>
          candidate.applicationId === variables.id
            ? { ...candidate, stage: variables.previousStage }
            : candidate
        )
      );
    },
  });

  const onDragStart = (e: DragEvent, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDrop = (stage: ApplicationStage) => {
    if (!dragId) return;
    const cand = items.find((i) => i.applicationId === dragId);
    if (!cand) return;

    if (cand.stage === stage) {
      setDragId(null);
      setOverStage(null);
      return;
    }

    const previousStage = cand.stage;
    setItems((prev) =>
      prev.map((candidate) =>
        candidate.applicationId === dragId ? { ...candidate, stage } : candidate
      )
    );
    setDragId(null);
    setOverStage(null);

    if (stage === "ENTREVISTA") {
      setPendingInterviewMove({ id: cand.applicationId, status: stage, previousStage });
      setInterviewModalOpen(true);
      return;
    }

    updateStatus.mutate({ id: cand.applicationId, status: stage, previousStage });
    toast.success(`${cand.name} movido a ${stageLabel[stage]}`);
  };

  const handleInterviewSchedule = () => {
    if (!pendingInterviewMove) return;
    if (!interviewForm.date || !interviewForm.time) {
      toast.error("Selecciona fecha y hora para la entrevista");
      return;
    }
    if (interviewForm.mode === "PRESENCIAL" && !interviewForm.location.trim()) {
      toast.error("La dirección es obligatoria para entrevista presencial");
      return;
    }
    if (interviewForm.mode === "REMOTO" && !interviewForm.meetingLink.trim()) {
      toast.error("El link de reunión es obligatorio para entrevista remota");
      return;
    }

    const isoDate = new Date(`${interviewForm.date}T${interviewForm.time}`).toISOString();

    updateStatus.mutate({
      ...pendingInterviewMove,
      sendEmail: interviewForm.sendEmail,
      companyBranding: {
        displayName: interviewForm.companyDisplayName || user?.name || "Empresa",
        logoUrl: interviewForm.companyLogoUrl || undefined,
      },
      interview: {
        mode: interviewForm.mode,
        scheduledAt: isoDate,
        timezone: interviewForm.timezone,
        location: interviewForm.mode === "PRESENCIAL" ? interviewForm.location : undefined,
        meetingLink: interviewForm.mode === "REMOTO" ? interviewForm.meetingLink : undefined,
        notes: interviewForm.notes || undefined,
      },
    });

    setInterviewModalOpen(false);
    setPendingInterviewMove(null);
    toast.success(
      interviewForm.sendEmail
        ? "Entrevista programada. Verificando envío de correo..."
        : "Entrevista programada y etapa actualizada"
    );
  };

  const closeInterviewModal = () => {
    if (pendingInterviewMove) {
      setItems((prev) =>
        prev.map((candidate) =>
          candidate.applicationId === pendingInterviewMove.id
            ? { ...candidate, stage: pendingInterviewMove.previousStage }
            : candidate
        )
      );
    }
    setInterviewModalOpen(false);
    setPendingInterviewMove(null);
  };

  const totalByStage = (s: ApplicationStage) => items.filter((i) => i.stage === s).length;
  const total = items.length;

  return (
    <div>
      <PageHeader
        eyebrow="Pipeline"
        title="Tu proceso de selección"
        subtitle="Arrastra candidatos entre etapas. Cada movimiento se guarda en backend en tiempo real."
      />

      {isLoading ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground inline-flex items-center gap-2 mb-5">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando pipeline...
        </div>
      ) : null}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-5">
        {stages.map(s => {
          const n = totalByStage(s.id);
          const max = total || 1;
          return (
            <div key={s.id} className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-center gap-2">
                <span className={cn("h-2 w-2 rounded-full", s.dot)} />
                <p className="text-[10px] uppercase tracking-wider font-subtitle font-semibold text-muted-foreground">{s.label}</p>
              </div>
              <p className="mt-1 font-display text-2xl font-bold">{n}</p>
              <progress
                value={n}
                max={max}
                className={cn(
                  "mt-1 w-full h-1 rounded-full overflow-hidden [&::-webkit-progress-bar]:bg-surface-elevated [&::-moz-progress-bar]:bg-surface-elevated",
                  s.dot === "bg-info" && "[&::-webkit-progress-value]:bg-info [&::-moz-progress-bar]:bg-info",
                  s.dot === "bg-amber-500" && "[&::-webkit-progress-value]:bg-amber-500 [&::-moz-progress-bar]:bg-amber-500",
                  s.dot === "bg-violet-500" && "[&::-webkit-progress-value]:bg-violet-500 [&::-moz-progress-bar]:bg-violet-500",
                  s.dot === "bg-primary" && "[&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:bg-primary",
                  s.dot === "bg-emerald-500" && "[&::-webkit-progress-value]:bg-emerald-500 [&::-moz-progress-bar]:bg-emerald-500",
                  s.dot === "bg-rose-500" && "[&::-webkit-progress-value]:bg-rose-500 [&::-moz-progress-bar]:bg-rose-500"
                )}
              />
            </div>
          );
        })}
      </div>

      {/* Board */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="flex gap-4 px-4 sm:px-0 min-w-max sm:min-w-full">
          {stages.map(s => {
            const list = items.filter(i => i.stage === s.id);
            const isOver = overStage === s.id;
            return (
              <section
                key={s.id}
                onDragOver={(e) => { e.preventDefault(); setOverStage(s.id); }}
                onDragLeave={() => setOverStage(prev => (prev === s.id ? null : prev))}
                onDrop={() => onDrop(s.id)}
                className={cn(
                  "w-72 shrink-0 rounded-2xl bg-surface-elevated/60 p-3 border-2 transition-colors",
                  isOver ? "border-foreground bg-surface-elevated" : "border-transparent",
                )}
              >
                <header className="flex items-center justify-between px-2 py-1 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", s.dot)} />
                    <p className="text-xs font-subtitle font-semibold uppercase tracking-wider">{s.label}</p>
                    <span className="text-[10px] h-5 min-w-5 px-1.5 rounded-full bg-foreground text-background flex items-center justify-center font-semibold">
                      {list.length}
                    </span>
                  </div>
                </header>

                <div className="space-y-2 min-h-[120px]">
                  {list.length === 0 && (
                    <div className="text-[11px] text-center text-muted-foreground py-8 font-sans border-2 border-dashed border-border rounded-xl">
                      Suelta aquí
                    </div>
                  )}
                  {list.map(c => (
                    <article
                      key={c.applicationId}
                      draggable
                      onDragStart={(e) => onDragStart(e, c.applicationId)}
                      className={cn(
                        "rounded-xl border bg-card p-3 cursor-grab active:cursor-grabbing transition-all hover:shadow-md hover:border-foreground",
                        dragId === c.applicationId && "opacity-40 rotate-1",
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="h-3.5 w-3.5 text-muted-foreground mt-1 shrink-0" />
                        <div className="h-9 w-9 rounded-full bg-foreground text-background text-[10px] flex items-center justify-center font-semibold shrink-0 overflow-hidden">
                          {c.avatarUrl ? (
                            <img src={c.avatarUrl} alt={c.name} className="w-full h-full object-cover" />
                          ) : (
                            c.name.split(" ").map((n) => n[0]).slice(0, 2).join("")
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-subtitle font-semibold truncate">{c.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate font-sans">{c.headline}</p>
                          <p className="text-[10px] text-muted-foreground truncate font-sans">{c.jobTitle}</p>
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1">
                        {(c.skills.length > 0 ? c.skills : ["Sin skills"]).slice(0, 2).map(sk => (
                          <span key={sk} className="text-[10px] px-1.5 py-0.5 rounded bg-surface-elevated font-sans">{sk}</span>
                        ))}
                      </div>

                      <footer className="mt-2 pt-2 border-t border-border flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[10px] font-subtitle font-semibold text-primary">
                          <Star className="h-3 w-3 fill-primary" /> {Math.round(c.match)}%
                        </div>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground"
                          aria-label="Mensaje"
                          onClick={() => navigate("/app/empresa/mensajes")}
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </button>
                      </footer>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {!isLoading && items.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground mt-5">
          No tienes aplicaciones todavía. Publica vacantes para comenzar tu pipeline real.
        </div>
      )}

      <Dialog open={interviewModalOpen} onOpenChange={(open) => { if (!open) closeInterviewModal(); }}>
        <DialogContent className="rounded-2xl sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-subtitle">Programar entrevista</DialogTitle>
            <DialogDescription>
              Define modalidad, fecha y datos de la reunión. Al guardar se actualiza la etapa y se puede enviar por correo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="interview-mode" className="text-xs text-muted-foreground">Modalidad</label>
                <select
                  id="interview-mode"
                  title="Modalidad de entrevista"
                  value={interviewForm.mode}
                  onChange={(e) => setInterviewForm((prev) => ({ ...prev, mode: e.target.value as "REMOTO" | "PRESENCIAL" }))}
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
                >
                  <option value="REMOTO">Remota</option>
                  <option value="PRESENCIAL">Presencial</option>
                </select>
              </div>
              <div>
                <label htmlFor="interview-timezone" className="text-xs text-muted-foreground">Zona horaria</label>
                <input
                  id="interview-timezone"
                  title="Zona horaria"
                  value={interviewForm.timezone}
                  onChange={(e) => setInterviewForm((prev) => ({ ...prev, timezone: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="interview-date" className="text-xs text-muted-foreground">Fecha</label>
                <input
                  id="interview-date"
                  title="Fecha de entrevista"
                  type="date"
                  value={interviewForm.date}
                  onChange={(e) => setInterviewForm((prev) => ({ ...prev, date: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
                />
              </div>
              <div>
                <label htmlFor="interview-time" className="text-xs text-muted-foreground">Hora</label>
                <input
                  id="interview-time"
                  title="Hora de entrevista"
                  type="time"
                  value={interviewForm.time}
                  onChange={(e) => setInterviewForm((prev) => ({ ...prev, time: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
                />
              </div>
            </div>

            {interviewForm.mode === "PRESENCIAL" ? (
              <div>
                <label htmlFor="interview-location" className="text-xs text-muted-foreground">Dirección</label>
                <input
                  id="interview-location"
                  title="Dirección presencial"
                  value={interviewForm.location}
                  onChange={(e) => setInterviewForm((prev) => ({ ...prev, location: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
                  placeholder="Calle, ciudad, oficina"
                />
              </div>
            ) : (
              <div>
                <label htmlFor="interview-link" className="text-xs text-muted-foreground">Link de reunión</label>
                <input
                  id="interview-link"
                  title="Link de entrevista remota"
                  value={interviewForm.meetingLink}
                  onChange={(e) => setInterviewForm((prev) => ({ ...prev, meetingLink: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
                  placeholder="https://meet.google.com/..."
                />
              </div>
            )}

            <div>
              <label htmlFor="interview-brand-name" className="text-xs text-muted-foreground">Nombre visible empresa</label>
              <input
                id="interview-brand-name"
                title="Nombre visible de empresa"
                value={interviewForm.companyDisplayName}
                onChange={(e) => setInterviewForm((prev) => ({ ...prev, companyDisplayName: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
              />
            </div>

            <div>
              <label htmlFor="interview-brand-logo" className="text-xs text-muted-foreground">URL logo empresa (opcional)</label>
              <input
                id="interview-brand-logo"
                title="URL del logo de empresa"
                value={interviewForm.companyLogoUrl}
                onChange={(e) => setInterviewForm((prev) => ({ ...prev, companyLogoUrl: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
                placeholder="https://.../logo.png"
              />
            </div>

            <div>
              <label htmlFor="interview-notes" className="text-xs text-muted-foreground">Notas para candidato (opcional)</label>
              <textarea
                id="interview-notes"
                title="Notas para entrevista"
                value={interviewForm.notes}
                onChange={(e) => setInterviewForm((prev) => ({ ...prev, notes: e.target.value }))}
                className="mt-1 min-h-20 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                placeholder="Indicaciones de acceso, documentos, etc."
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={interviewForm.sendEmail}
                onChange={(e) => setInterviewForm((prev) => ({ ...prev, sendEmail: e.target.checked }))}
              />
              Enviar esta programación al Gmail del candidato
            </label>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                className="h-10 px-4 rounded-lg border border-border text-sm font-subtitle"
                onClick={closeInterviewModal}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="h-10 px-4 rounded-lg bg-foreground text-background text-sm font-subtitle disabled:opacity-50"
                onClick={handleInterviewSchedule}
                disabled={updateStatus.isPending}
              >
                {updateStatus.isPending ? "Guardando..." : "Guardar y mover a Entrevista"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmpresaPipeline;
