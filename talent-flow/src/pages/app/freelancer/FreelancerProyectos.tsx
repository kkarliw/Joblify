import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BriefcaseBusiness, Calendar, Send } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { freelanceApi } from "@/lib/api";

type OpenProject = {
  id: string;
  title: string;
  description: string;
  budget: number;
  currency?: string;
  createdAt?: string;
  deadline?: string | null;
  client?: {
    id: string;
    name?: string;
    avatarUrl?: string | null;
    isVerified?: boolean;
  };
  _count?: {
    proposals?: number;
  };
};

type Proposal = {
  id: string;
  projectId: string;
};

type Service = {
  id: string;
  title: string;
};

type ProposalDraft = {
  price: string;
  deliveryDays: string;
  coverLetter: string;
  serviceId: string;
};

type ProjectSort = "RECENT" | "OLD" | "BUDGET_HIGH" | "BUDGET_LOW";

const initialDraft: ProposalDraft = {
  price: "",
  deliveryDays: "",
  coverLetter: "",
  serviceId: "",
};

const formatMoney = (value: number, currency = "USD") =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatDate = (value?: string | null) => {
  if (!value) return "Sin fecha límite";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha límite";
  return date.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
};

const FreelancerProyectos = () => {
  const queryClient = useQueryClient();
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, ProposalDraft>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [sortBy, setSortBy] = useState<ProjectSort>("RECENT");

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["freelance", "projects"],
    queryFn: () => freelanceApi.getProjects().then((res) => res.data as OpenProject[]),
  });

  const { data: proposals = [] } = useQuery({
    queryKey: ["freelance", "my-proposals"],
    queryFn: () => freelanceApi.getMyProposals().then((res) => res.data as Proposal[]),
  });

  const { data: services = [] } = useQuery({
    queryKey: ["freelance", "my-services"],
    queryFn: () => freelanceApi.getMyServices().then((res) => res.data as Service[]),
  });

  const proposedProjectIds = useMemo(() => new Set(proposals.map((proposal) => proposal.projectId)), [proposals]);

  const visibleProjects = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();
    const min = Number(budgetMin);
    const max = Number(budgetMax);
    const hasMin = budgetMin.trim() !== "" && Number.isFinite(min);
    const hasMax = budgetMax.trim() !== "" && Number.isFinite(max);

    const filtered = projects.filter((project) => {
      const budget = Number(project.budget || 0);
      const haystack = `${project.title || ""} ${project.description || ""} ${project.client?.name || ""}`.toLowerCase();

      if (normalizedQuery && !haystack.includes(normalizedQuery)) return false;
      if (hasMin && budget < min) return false;
      if (hasMax && budget > max) return false;

      return true;
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sortBy === "BUDGET_HIGH") return Number(b.budget || 0) - Number(a.budget || 0);
      if (sortBy === "BUDGET_LOW") return Number(a.budget || 0) - Number(b.budget || 0);

      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();

      if (sortBy === "OLD") return dateA - dateB;
      return dateB - dateA;
    });

    return sorted;
  }, [projects, searchTerm, budgetMin, budgetMax, sortBy]);

  const submitProposalMutation = useMutation({
    mutationFn: ({ projectId, payload }: { projectId: string; payload: Record<string, unknown> }) =>
      freelanceApi.submitProposal(projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["freelance", "my-proposals"] });
      toast.success("Propuesta enviada con éxito");
      setExpandedProjectId(null);
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "No se pudo enviar la propuesta";
      toast.error(message);
    },
  });

  const getDraft = (projectId: string) => drafts[projectId] || initialDraft;

  const updateDraft = (projectId: string, patch: Partial<ProposalDraft>) => {
    setDrafts((prev) => ({
      ...prev,
      [projectId]: {
        ...(prev[projectId] || initialDraft),
        ...patch,
      },
    }));
  };

  const openProposalForm = (projectId: string, budget: number) => {
    setExpandedProjectId(projectId);
    if (!drafts[projectId]) {
      updateDraft(projectId, {
        price: budget > 0 ? String(Math.round(budget)) : "",
        deliveryDays: "7",
      });
    }
  };

  const handleSubmit = (projectId: string) => {
    const draft = getDraft(projectId);
    const price = Number(draft.price);
    const deliveryDays = Number(draft.deliveryDays);
    const coverLetter = draft.coverLetter.trim();

    if (!Number.isFinite(price) || price <= 0) {
      toast.error("Ingresa un precio válido");
      return;
    }
    if (!Number.isInteger(deliveryDays) || deliveryDays <= 0) {
      toast.error("Ingresa días de entrega válidos");
      return;
    }
    if (coverLetter.length < 20) {
      toast.error("La propuesta debe tener mínimo 20 caracteres");
      return;
    }

    submitProposalMutation.mutate({
      projectId,
      payload: {
        price,
        deliveryDays,
        coverLetter,
        serviceId: draft.serviceId || undefined,
      },
    });
  };

  return (
    <div>
      <PageHeader
        eyebrow="Marketplace"
        title="Proyectos abiertos"
        subtitle="Descubre oportunidades activas y envía propuestas directamente a clientes." 
      />

      <div className="mb-4 rounded-2xl border border-border bg-card p-4 grid gap-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <input
            className="h-9 rounded-lg border border-border px-3 text-sm lg:col-span-2"
            placeholder="Buscar por título, descripción o cliente"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <input
            className="h-9 rounded-lg border border-border px-3 text-sm"
            placeholder="Presupuesto mínimo"
            value={budgetMin}
            onChange={(e) => setBudgetMin(e.target.value)}
          />

          <input
            className="h-9 rounded-lg border border-border px-3 text-sm"
            placeholder="Presupuesto máximo"
            value={budgetMax}
            onChange={(e) => setBudgetMax(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <select
            className="h-9 rounded-lg border border-border px-3 text-sm"
            aria-label="Ordenar proyectos"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as ProjectSort)}
          >
            <option value="RECENT">Más recientes</option>
            <option value="OLD">Más antiguos</option>
            <option value="BUDGET_HIGH">Mayor presupuesto</option>
            <option value="BUDGET_LOW">Menor presupuesto</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setBudgetMin("");
              setBudgetMax("");
              setSortBy("RECENT");
            }}
            className="h-9 px-3 rounded-lg border border-border text-xs font-semibold"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {projectsLoading && (
          <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
            Cargando proyectos disponibles...
          </div>
        )}

        {!projectsLoading && projects.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center">
            <BriefcaseBusiness className="h-5 w-5 mx-auto text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No hay proyectos abiertos por el momento.</p>
          </div>
        )}

        {!projectsLoading && projects.length > 0 && visibleProjects.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center">
            <BriefcaseBusiness className="h-5 w-5 mx-auto text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No hay resultados con los filtros actuales.</p>
          </div>
        )}

        {!projectsLoading &&
          visibleProjects.map((project) => {
            const alreadyProposed = proposedProjectIds.has(project.id);
            const draft = getDraft(project.id);

            return (
              <article key={project.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-subtitle font-semibold text-base">{project.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {project.client?.name || "Cliente"} · {formatMoney(Number(project.budget || 0), project.currency || "USD")}
                    </p>
                  </div>
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-surface-elevated font-subtitle font-semibold">
                    {Number(project._count?.proposals || 0)} propuestas
                  </span>
                </div>

                <p className="mt-3 text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{project.description}</p>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Cierre: {formatDate(project.deadline)}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {alreadyProposed ? (
                    <span className="h-8 px-3 inline-flex items-center rounded-lg bg-emerald-500/15 text-emerald-700 text-xs font-semibold">
                      Ya postulaste a este proyecto
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openProposalForm(project.id, Number(project.budget || 0))}
                      className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
                    >
                      Postularme
                    </button>
                  )}
                </div>

                {!alreadyProposed && expandedProjectId === project.id && (
                  <div className="mt-4 grid gap-2 rounded-xl border border-border p-3">
                    <div className="grid sm:grid-cols-2 gap-2">
                      <input
                        className="h-9 rounded-lg border border-border px-3 text-sm"
                        placeholder="Tu propuesta económica"
                        value={draft.price}
                        onChange={(e) => updateDraft(project.id, { price: e.target.value })}
                      />
                      <input
                        className="h-9 rounded-lg border border-border px-3 text-sm"
                        placeholder="Entrega (días)"
                        value={draft.deliveryDays}
                        onChange={(e) => updateDraft(project.id, { deliveryDays: e.target.value })}
                      />
                    </div>

                    <select
                      className="h-9 rounded-lg border border-border px-3 text-sm"
                      aria-label="Servicio relacionado"
                      value={draft.serviceId}
                      onChange={(e) => updateDraft(project.id, { serviceId: e.target.value })}
                    >
                      <option value="">Servicio relacionado (opcional)</option>
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.title}
                        </option>
                      ))}
                    </select>

                    <textarea
                      className="rounded-lg border border-border px-3 py-2 text-sm"
                      rows={3}
                      placeholder="Cuéntale al cliente por qué eres ideal para este proyecto"
                      value={draft.coverLetter}
                      onChange={(e) => updateDraft(project.id, { coverLetter: e.target.value })}
                    />

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleSubmit(project.id)}
                        disabled={submitProposalMutation.isPending}
                        className="h-8 px-3 rounded-lg bg-foreground text-background text-xs font-semibold disabled:opacity-50 inline-flex items-center gap-1"
                      >
                        <Send className="h-3.5 w-3.5" /> Enviar propuesta
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedProjectId(null)}
                        className="h-8 px-3 rounded-lg border border-border text-xs font-semibold"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
      </div>
    </div>
  );
};

export default FreelancerProyectos;
