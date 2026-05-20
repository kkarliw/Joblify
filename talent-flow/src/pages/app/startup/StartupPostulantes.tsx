import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { CheckCircle2, MessageSquare, X } from "lucide-react";
import { startupApi } from "@/lib/api";
import { toast } from "sonner";

type StartupApplication = {
  id: string;
  status: "PENDIENTE" | "EN_REVISION" | "ACEPTADO" | "RECHAZADO";
  motivation: string;
  createdAt: string;
  startup: { id: string; name: string; stage: string };
  role?: { id: string; title: string } | null;
  applicant: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    headline?: string | null;
    location?: string | null;
  };
};

const STATUS_LABEL: Record<StartupApplication["status"], string> = {
  PENDIENTE: "Nuevo",
  EN_REVISION: "En revisión",
  ACEPTADO: "Aceptado",
  RECHAZADO: "Rechazado",
};

const STATUS_STYLE: Record<StartupApplication["status"], string> = {
  PENDIENTE: "bg-surface-elevated text-foreground",
  EN_REVISION: "bg-primary/15 text-primary",
  ACEPTADO: "bg-emerald-500/15 text-emerald-700",
  RECHAZADO: "bg-red-500/15 text-red-700",
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";
  return date.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
};

const FILTERS = ["TODOS", "PENDIENTE", "EN_REVISION", "ACEPTADO", "RECHAZADO"] as const;
type ApplicationFilter = (typeof FILTERS)[number];

const StartupPostulantes = () => {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<ApplicationFilter>("TODOS");

  const { data: applicants = [], isLoading } = useQuery({
    queryKey: ["startups", "my-applications"],
    queryFn: () => startupApi.myApplications().then((res) => res.data as StartupApplication[]),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: StartupApplication["status"] }) =>
      startupApi.updateApplicationStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["startups", "my-applications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Estado de postulación actualizado");
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "No se pudo actualizar la postulación";
      toast.error(message);
    },
  });

  const filteredApplicants = useMemo(() => {
    if (activeFilter === "TODOS") return applicants;
    return applicants.filter((item) => item.status === activeFilter);
  }, [activeFilter, applicants]);

  return (
    <div>
      <PageHeader eyebrow="Tus proyectos" title="Postulantes a cofundador" subtitle="Personas que se han postulado para sumarse a tus startups." />

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const active = activeFilter === filter;
          return (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`h-8 px-3 rounded-full text-xs font-semibold border transition-colors ${
                active
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {filter === "TODOS" ? "Todos" : STATUS_LABEL[filter]}
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <ul className="divide-y divide-border">
          {isLoading && <li className="p-5 text-sm text-muted-foreground">Cargando postulantes...</li>}

          {!isLoading && filteredApplicants.length === 0 && (
            <li className="p-5 text-sm text-muted-foreground">No hay postulantes para este filtro todavía.</li>
          )}

          {!isLoading &&
            filteredApplicants.map((application) => (
              <li key={application.id} className="p-5 flex items-center gap-4">
                <div className="h-11 w-11 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-semibold overflow-hidden">
                  {application.applicant.avatarUrl ? (
                    <img
                      src={application.applicant.avatarUrl}
                      alt={application.applicant.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    application.applicant.name.split(" ").map((n) => n[0]).slice(0, 2).join("")
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-subtitle font-semibold truncate">{application.applicant.name}</p>
                  <p className="text-xs text-muted-foreground font-sans truncate">
                    {application.startup.name} · {application.role?.title || "Rol general"} · {formatDate(application.createdAt)}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{application.motivation}</p>
                </div>
                <span className={`text-[11px] px-2 py-1 rounded-full font-subtitle font-semibold ${STATUS_STYLE[application.status]}`}>
                  {STATUS_LABEL[application.status]}
                </span>
                <div className="flex items-center gap-1.5">
                  <Link
                    to="/app/startup/mensajes"
                    className="h-8 w-8 rounded-lg border border-border hover:bg-surface-elevated flex items-center justify-center"
                    aria-label="Mensaje"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    type="button"
                    className="h-8 w-8 rounded-lg border border-border hover:bg-surface-elevated flex items-center justify-center"
                    aria-label="Marcar en revisión"
                    disabled={updateStatus.isPending}
                    onClick={() => updateStatus.mutate({ id: application.id, status: "EN_REVISION" })}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    className="h-8 w-8 rounded-lg bg-foreground text-background flex items-center justify-center"
                    aria-label="Aceptar"
                    disabled={updateStatus.isPending}
                    onClick={() => updateStatus.mutate({ id: application.id, status: "ACEPTADO" })}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    className="h-8 w-8 rounded-lg border border-border hover:bg-surface-elevated flex items-center justify-center"
                    aria-label="Descartar"
                    disabled={updateStatus.isPending}
                    onClick={() => updateStatus.mutate({ id: application.id, status: "RECHAZADO" })}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
};

export default StartupPostulantes;
