import { useEffect, useMemo, useState } from "react";
import { Loader2, Send, Sparkles, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { aiApi, applicationsApi, freelanceApi, jobsApi, savedApi, startupApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

type AssistantMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

type JobLite = {
  id: string;
  title?: string;
  isActive?: boolean;
};

type ApplicationLite = {
  status?: string;
};

type ProposalLite = {
  status?: string;
};

type StartupLite = {
  id: string;
  name?: string;
  applicationsCount?: number;
  applicantsCount?: number;
};

type AssistantConfig = {
  aiContext: "recruiter" | "career_advice" | "pre_interview";
  welcome: string;
  placeholder: string;
  errorHint: string;
  quickPrompts: string[];
};

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const AppAssistantWidget = () => {
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);

  const assistantConfig = useMemo<AssistantConfig>(() => {
    switch (user?.role) {
      case "empresa":
        return {
          aiContext: "recruiter" as const,
          welcome: `Hola ${user?.name ? user.name.split(" ")[0] : ""}, soy tu asistente de Joblify. Puedes preguntarme por pipeline, entrevistas, ofertas y vacantes activas.`,
          placeholder: "Pregunta por tu pipeline o tus vacantes...",
          errorHint: "No pude conectarme al modelo IA ahora mismo. También puedes preguntarme cosas como: '¿cuántas entrevistas tengo?' o '¿cuál es mi vacante con más postulaciones?'.",
          quickPrompts: [
            "¿Hay nuevas postulaciones?",
            "¿Cuántas entrevistas tengo?",
            "¿Cuál es mi vacante con más postulaciones?",
          ],
        };
      case "freelancer":
        return {
          aiContext: "career_advice" as const,
          welcome: `Hola ${user?.name ? user.name.split(" ")[0] : ""}, soy tu asistente de Joblify. Puedo ayudarte con propuestas, ingresos, posicionamiento y siguientes pasos.`,
          placeholder: "Pregunta por tus propuestas, ingresos o servicios...",
          errorHint: "No pude conectarme al modelo IA ahora mismo. También puedes preguntarme: '¿cuántas propuestas activas tengo?' o '¿cuánto llevo este mes?'.",
          quickPrompts: [
            "¿Cuántas propuestas activas tengo?",
            "¿Cuánto llevo este mes?",
            "¿Cuántos servicios tengo publicados?",
          ],
        };
      case "emprendedor":
        return {
          aiContext: "recruiter" as const,
          welcome: `Hola ${user?.name ? user.name.split(" ")[0] : ""}, soy tu asistente de Joblify. Puedo ayudarte con proyectos, postulantes y crecimiento de tu startup.`,
          placeholder: "Pregunta por tus proyectos o postulantes...",
          errorHint: "No pude conectarme al modelo IA ahora mismo. También puedes preguntarme: '¿cuántos postulantes tengo?' o '¿cuántas startups tengo registradas?'.",
          quickPrompts: [
            "¿Cuántos postulantes tengo?",
            "¿Cuántas startups tengo registradas?",
            "¿Qué debería priorizar en mi proyecto esta semana?",
          ],
        };
      case "estudiante":
        return {
          aiContext: "career_advice" as const,
          welcome: `Hola ${user?.name ? user.name.split(" ")[0] : ""}, soy tu asistente de Joblify. Te ayudo con prácticas, aplicaciones activas, ofertas y próximos pasos.`,
          placeholder: "Pregunta por tus prácticas, ofertas o aplicaciones...",
          errorHint: "No pude conectarme al modelo IA ahora mismo. También puedes preguntarme: '¿cuántas aplicaciones activas tengo?' o '¿cuántas guardadas tengo?'.",
          quickPrompts: [
            "¿Cuántas aplicaciones activas tengo?",
            "¿Cuántas guardadas tengo?",
            "¿Qué puedo mejorar para conseguir una práctica?",
          ],
        };
      case "candidato":
      default:
        return {
          aiContext: "career_advice" as const,
          welcome: `Hola ${user?.name ? user.name.split(" ")[0] : ""}, soy tu asistente de Joblify. Te ayudo con postulaciones, ofertas, guardados y próximos movimientos.`,
          placeholder: "Pregunta por tus postulaciones, ofertas o guardados...",
          errorHint: "No pude conectarme al modelo IA ahora mismo. También puedes preguntarme: '¿cuántas postulaciones activas tengo?' o '¿cuántas vacantes guardadas tengo?'.",
          quickPrompts: [
            "¿Cuántas postulaciones activas tengo?",
            "¿Cuántas vacantes guardadas tengo?",
            "¿Qué debería hacer para recibir más entrevistas?",
          ],
        };
    }
  }, [user?.name, user?.role]);

  const welcome = assistantConfig.welcome;

  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: createId(),
      role: "assistant",
      content: welcome,
    },
  ]);

  useEffect(() => {
    setSessionId(null);
    setMessages([
      {
        id: createId(),
        role: "assistant",
        content: welcome,
      },
    ]);
  }, [welcome, user?.id, user?.role]);

  const buildChatErrorFallback = (prompt?: string) => {
    const normalized = (prompt || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

    const isGreeting = ["hola", "buenas", "hello", "hey"].some(
      (greeting) => normalized === greeting || normalized.startsWith(`${greeting} `)
    );

    if (isGreeting) {
      const topPrompts = assistantConfig.quickPrompts.slice(0, 2).map((promptText) => `- ${promptText}`).join("\n");
      return [
        "Aquí estoy. El modelo IA está temporalmente no disponible, pero puedo ayudarte con respuestas rápidas de tu panel.",
        "Puedes empezar con:",
        topPrompts,
      ].join("\n");
    }

    const roleHint = assistantConfig.quickPrompts[0]
      ? `Prueba ahora con: "${assistantConfig.quickPrompts[0]}".`
      : "Prueba con una consulta específica de tu panel.";

    return `${assistantConfig.errorHint}\n\n${roleHint}`;
  };

  const chatMutation = useMutation({
    mutationFn: (prompt: string) => aiApi.chat(prompt, assistantConfig.aiContext, sessionId || undefined),
    onSuccess: (response) => {
      const payload = response.data as { reply?: string; sessionId?: string };
      const reply = payload?.reply?.trim();
      if (payload?.sessionId) {
        setSessionId(payload.sessionId);
      }
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: "assistant",
          content: reply || "Ahora mismo no pude generar respuesta. Intenta de nuevo en unos segundos.",
        },
      ]);
    },
    onError: (_error, prompt) => {
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: "assistant",
          content: buildChatErrorFallback(prompt),
        },
      ]);
    },
  });

  const normalizeText = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  const fetchCompanyData = async () => {
    const jobsResponse = await jobsApi.myPosted();
    const jobsPayload = jobsResponse.data;
    const jobs = (Array.isArray(jobsPayload) ? jobsPayload : []) as JobLite[];

    if (jobs.length === 0) {
      return { jobs, allApplications: [] as ApplicationLite[] };
    }

    const applicationsByJob = await Promise.all(
      jobs.map(async (job) => {
        const response = await applicationsApi.byJob(job.id);
        return (Array.isArray(response.data) ? response.data : []) as ApplicationLite[];
      })
    );

    return { jobs, allApplications: applicationsByJob.flat() };
  };

  const fetchTalentData = async () => {
    const appsResponse = await applicationsApi.my();
    const apps = (Array.isArray(appsResponse.data) ? appsResponse.data : []) as ApplicationLite[];

    const savedJobsResponse = await savedApi.getJobs();
    const savedJobs = Array.isArray(savedJobsResponse.data) ? savedJobsResponse.data : [];

    return { apps, savedJobsCount: savedJobs.length };
  };

  const fetchFreelancerData = async () => {
    const [proposalsResponse, earningsResponse, servicesResponse] = await Promise.all([
      freelanceApi.getMyProposals(),
      freelanceApi.getMyEarnings(),
      freelanceApi.getMyServices(),
    ]);

    const proposals = (Array.isArray(proposalsResponse.data) ? proposalsResponse.data : []) as ProposalLite[];
    const earnings = (earningsResponse.data || {}) as { total?: number; thisMonth?: number; projectsCompleted?: number };
    const services = Array.isArray(servicesResponse.data) ? servicesResponse.data : [];

    return { proposals, earnings, servicesCount: services.length };
  };

  const fetchStartupData = async () => {
    const [ownedResponse, applicationsResponse] = await Promise.all([
      startupApi.myOwned(),
      startupApi.myApplications(),
    ]);

    const owned = (Array.isArray(ownedResponse.data) ? ownedResponse.data : []) as StartupLite[];
    const applications = Array.isArray(applicationsResponse.data) ? applicationsResponse.data : [];

    return { owned, applicationsCount: applications.length };
  };

  const appendAssistant = (content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: createId(),
        role: "assistant",
        content,
      },
    ]);
  };

  const resolveDeterministicIntent = async (normalized: string): Promise<string | null> => {
    if (!user) return null;

    if (user.role === "empresa") {
      const asksNewApplications =
        normalized.includes("postulacion") ||
        normalized.includes("candidatos nuevos") ||
        normalized.includes("nuevas aplicaciones");
      const asksInterviews = normalized.includes("entrevista");
      const asksOffers = normalized.includes("oferta");
      const asksHired = normalized.includes("contratad") || normalized.includes("seleccionad");
      const asksRejected = normalized.includes("rechazad") || normalized.includes("no seleccionado");
      const asksPipeline = normalized.includes("pipeline") || normalized.includes("embudo") || normalized.includes("estado");
      const asksVacancies = normalized.includes("vacante") || normalized.includes("publicadas") || normalized.includes("activas");
      const asksTopVacancy = normalized.includes("mas postul") || normalized.includes("top vacante") || normalized.includes("vacante top");

      if (
        !asksNewApplications &&
        !asksInterviews &&
        !asksOffers &&
        !asksHired &&
        !asksRejected &&
        !asksPipeline &&
        !asksVacancies &&
        !asksTopVacancy
      ) {
        return null;
      }

      const { jobs, allApplications } = await fetchCompanyData();
      if (jobs.length === 0) {
        return "No tienes vacantes publicadas todavía, así que no hay postulaciones nuevas por revisar.";
      }

      const countByStatus = (status: string) =>
        allApplications.filter((application) => application.status === status).length;

      const appliedCount = countByStatus("APLICADO");
      const screeningCount = countByStatus("SCREENING");
      const interviewCount = countByStatus("ENTREVISTA");
      const offerCount = countByStatus("OFERTA");
      const hiredCount = countByStatus("CONTRATADO");
      const rejectedCount = countByStatus("RECHAZADO");
      const activeJobs = jobs.filter((job) => Boolean(job.isActive));

      const byJobCounts = await Promise.all(
        jobs.map(async (job) => {
          const response = await applicationsApi.byJob(job.id);
          const list = (Array.isArray(response.data) ? response.data : []) as ApplicationLite[];
          return { title: job.title || "Vacante", total: list.length };
        })
      );
      const topJob = byJobCounts.sort((a, b) => b.total - a.total)[0];

      if (asksNewApplications) {
        return appliedCount > 0
          ? `Sí. Tienes ${appliedCount} postulaciones nuevas en estado Aplicado.`
          : "Por ahora no hay postulaciones nuevas en estado Aplicado.";
      }
      if (asksInterviews) return `Tienes ${interviewCount} candidato(s) en etapa de Entrevista.`;
      if (asksOffers) return `Tienes ${offerCount} candidato(s) en etapa de Oferta.`;
      if (asksHired) return `Llevas ${hiredCount} candidato(s) contratado(s).`;
      if (asksRejected) return `Actualmente tienes ${rejectedCount} candidato(s) rechazado(s).`;
      if (asksTopVacancy) {
        return topJob
          ? `Tu vacante con más postulaciones es "${topJob.title}" con ${topJob.total} postulaciones.`
          : "Aún no hay postulaciones suficientes para identificar una vacante top.";
      }
      if (asksVacancies) {
        return `Tienes ${jobs.length} vacante(s) publicadas, de las cuales ${activeJobs.length} están activas.`;
      }

      return [
        "Resumen actual de tu pipeline:",
        `- Aplicado: ${appliedCount}`,
        `- Screening: ${screeningCount}`,
        `- Entrevista: ${interviewCount}`,
        `- Oferta: ${offerCount}`,
        `- Contratado: ${hiredCount}`,
        `- Rechazado: ${rejectedCount}`,
      ].join("\n");
    }

    if (user.role === "candidato" || user.role === "estudiante") {
      const asksApplications = normalized.includes("postul") || normalized.includes("aplicac");
      const asksSaved = normalized.includes("guardad") || normalized.includes("saved");
      const asksInterview = normalized.includes("entrevista");
      const asksOffer = normalized.includes("oferta");

      if (!asksApplications && !asksSaved && !asksInterview && !asksOffer) {
        return null;
      }

      const { apps, savedJobsCount } = await fetchTalentData();
      const active = apps.filter((item) => ["APLICADO", "SCREENING", "ENTREVISTA", "OFERTA"].includes(String(item.status))).length;
      const interview = apps.filter((item) => item.status === "ENTREVISTA").length;
      const offers = apps.filter((item) => item.status === "OFERTA").length;

      if (asksSaved) return `Tienes ${savedJobsCount} vacante(s) guardada(s).`;
      if (asksInterview) return `Tienes ${interview} proceso(s) en etapa de entrevista.`;
      if (asksOffer) return `Tienes ${offers} oferta(s) activa(s).`;
      return `Tienes ${apps.length} postulaciones totales y ${active} activas en proceso.`;
    }

    if (user.role === "freelancer") {
      const asksProposal = normalized.includes("propuesta");
      const asksEarnings = normalized.includes("ingreso") || normalized.includes("ganancia") || normalized.includes("earn");
      const asksServices = normalized.includes("servicio");

      if (!asksProposal && !asksEarnings && !asksServices) {
        return null;
      }

      const { proposals, earnings, servicesCount } = await fetchFreelancerData();
      const activeProposals = proposals.filter((proposal) => ["ENVIADA", "EN_REVISION"].includes(String(proposal.status))).length;

      if (asksEarnings) {
        return `Tus ingresos del mes van en ${Number(earnings.thisMonth || 0).toLocaleString("es-CO", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}.`;
      }
      if (asksServices) {
        return `Tienes ${servicesCount} servicio(s) publicado(s).`;
      }
      return `Tienes ${proposals.length} propuestas totales y ${activeProposals} activas en revisión.`;
    }

    if (user.role === "emprendedor") {
      const asksProjects = normalized.includes("proyecto") || normalized.includes("startup");
      const asksApplicants = normalized.includes("postulant") || normalized.includes("cofound") || normalized.includes("cofounder");

      if (!asksProjects && !asksApplicants) {
        return null;
      }

      const { owned, applicationsCount } = await fetchStartupData();
      const totalApplicants = owned.reduce(
        (acc, startup) => acc + Number(startup.applicationsCount || startup.applicantsCount || 0),
        0
      );

      if (asksApplicants) {
        return `Tus startups suman ${totalApplicants} postulante(s) y tú has enviado ${applicationsCount} aplicación(es) a otras startups.`;
      }
      return `Tienes ${owned.length} startup(s) propia(s) registrada(s) en la plataforma.`;
    }

    return null;
  };

  const sendMessage = (preset?: string) => {
    const value = (preset ?? input).trim();
    if (!value) return;

    setMessages((prev) => [
      ...prev,
      {
        id: createId(),
        role: "user",
        content: value,
      },
    ]);
    if (!preset) {
      setInput("");
    }

    const normalized = normalizeText(value);

    (async () => {
      try {
        const deterministicReply = await resolveDeterministicIntent(normalized);
        if (deterministicReply) {
          appendAssistant(deterministicReply);
          return;
        }
        chatMutation.mutate(value);
      } catch {
        appendAssistant("No pude consultar datos de tu cuenta en este momento. Intenta de nuevo en unos segundos.");
      }
    })();
  };

  return (
    <div className="fixed bottom-5 right-4 sm:right-6 z-50">
      {open && (
        <div className="mb-3 w-[92vw] max-w-[380px] rounded-2xl border border-border bg-card shadow-[0_20px_60px_rgba(0,0,0,0.16)] overflow-hidden">
          <div className="h-12 px-4 border-b border-border bg-surface-elevated flex items-center justify-between">
            <div className="inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-sm font-subtitle font-semibold">Asistente Joblify</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-8 w-8 rounded-full hover:bg-background/80 inline-flex items-center justify-center"
              aria-label="Cerrar asistente"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[320px] overflow-y-auto p-3 space-y-2 bg-background">
            <div className="flex flex-wrap gap-2 pb-1">
              {assistantConfig.quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-[11px] text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[92%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  message.role === "assistant"
                    ? "bg-surface-elevated text-foreground"
                    : "ml-auto bg-primary text-primary-foreground"
                }`}
              >
                {message.content}
              </div>
            ))}

            {chatMutation.isPending && (
              <div className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm bg-surface-elevated text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Pensando...
              </div>
            )}
          </div>

          <div className="p-3 border-t border-border bg-card flex items-center gap-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={assistantConfig.placeholder}
              className="flex-1 h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={() => sendMessage()}
              disabled={chatMutation.isPending}
              className="h-10 w-10 rounded-lg bg-primary text-primary-foreground inline-flex items-center justify-center disabled:opacity-60"
              aria-label="Enviar"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="h-12 w-12 rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.2)] hover:bg-primary-hover"
        aria-label={open ? "Cerrar asistente" : "Abrir asistente"}
        title={open ? "Cerrar asistente" : "Abrir asistente"}
      >
        {open ? <X className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      </button>
    </div>
  );
};
