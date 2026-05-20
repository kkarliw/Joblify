import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { freelanceApi } from "@/lib/api";

type ProposalItem = {
  id: string;
  price: number;
  currency?: string;
  deliveryDays?: number;
  status: string;
  createdAt?: string;
  project?: {
    id?: string;
    title?: string;
    client?: {
      name?: string;
    };
  };
};

const STATUS_LABELS: Record<string, string> = {
  ENVIADA: "Enviada",
  EN_REVISION: "En revisión",
  ACEPTADA: "Aceptada",
  RECHAZADA: "Rechazada",
};

const STATUS_STYLES: Record<string, string> = {
  ENVIADA: "bg-surface-elevated text-foreground",
  EN_REVISION: "bg-primary text-primary-foreground",
  ACEPTADA: "bg-emerald-500/15 text-emerald-700",
  RECHAZADA: "bg-red-500/15 text-red-700",
};

const FILTERS = ["TODAS", "ENVIADA", "EN_REVISION", "ACEPTADA", "RECHAZADA"] as const;
type ProposalFilter = (typeof FILTERS)[number];

const formatMoney = (value: number, currency = "USD") =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatDate = (value?: string) => {
  if (!value) return "Fecha no disponible";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";
  return date.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
};

const FreelancerPropuestas = () => {
  const [activeFilter, setActiveFilter] = useState<ProposalFilter>("TODAS");

  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ["freelance", "my-proposals"],
    queryFn: () => freelanceApi.getMyProposals().then((res) => res.data as ProposalItem[]),
  });

  const filtered = useMemo(() => {
    if (activeFilter === "TODAS") return proposals;
    return proposals.filter((item) => item.status === activeFilter);
  }, [activeFilter, proposals]);

  return (
    <div>
      <PageHeader
        eyebrow="Pipeline"
        title="Mis propuestas"
        subtitle="Revisa el estado de tus postulaciones y el historial de propuestas enviadas."
      />

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
              {filter === "TODAS" ? "Todas" : STATUS_LABELS[filter] || filter}
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <ul className="divide-y divide-border">
          {isLoading && <li className="p-5 text-sm text-muted-foreground">Cargando propuestas...</li>}

          {!isLoading && filtered.length === 0 && (
            <li className="p-5 text-sm text-muted-foreground">No tienes propuestas para este filtro todavía.</li>
          )}

          {!isLoading &&
            filtered.map((proposal) => (
              <li key={proposal.id} className="p-4 flex items-start gap-4 hover:bg-surface-elevated/50">
                <div className="h-10 w-10 rounded-xl bg-foreground text-background flex items-center justify-center text-xs font-semibold shrink-0">
                  <FileText className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-subtitle font-semibold truncate">
                    {proposal.project?.title || "Proyecto"}
                  </p>
                  <p className="text-xs text-muted-foreground font-sans mt-0.5">
                    {proposal.project?.client?.name || "Cliente"} · {formatMoney(Number(proposal.price || 0), proposal.currency || "USD")}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Entrega: {Number(proposal.deliveryDays || 0)} días · Enviada: {formatDate(proposal.createdAt)}
                  </p>
                </div>

                <span
                  className={`text-[10px] font-subtitle font-semibold uppercase px-2.5 py-1 rounded-full ${
                    STATUS_STYLES[proposal.status] || "bg-surface-elevated text-foreground"
                  }`}
                >
                  {STATUS_LABELS[proposal.status] || proposal.status}
                </span>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
};

export default FreelancerPropuestas;
