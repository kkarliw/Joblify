import { Link } from "react-router-dom";
import { ArrowRight, FolderKanban, Wallet, Star, FileText, Sparkles } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useQuery } from "@tanstack/react-query";
import { freelanceApi } from "@/lib/api";

type ProposalItem = {
  id: string;
  price: number;
  currency?: string;
  status: string;
  project?: {
    title?: string;
    client?: { name?: string };
  };
};

const formatMoney = (value: number, currency = "USD") =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0);

const STATUS_LABELS: Record<string, string> = {
  ENVIADA: "Enviada",
  EN_REVISION: "En revisión",
  ACEPTADA: "Aceptada",
  RECHAZADA: "Rechazada",
};

const FreelancerDashboard = () => {
  const session = useAuthStore((state) => state.user);

  const { data: proposals = [], isLoading: proposalsLoading } = useQuery({
    queryKey: ["freelance", "my-proposals"],
    queryFn: () => freelanceApi.getMyProposals().then((res) => res.data as ProposalItem[]),
    enabled: !!session?.id,
  });

  const { data: earnings } = useQuery({
    queryKey: ["freelance", "my-earnings"],
    queryFn: () =>
      freelanceApi.getMyEarnings().then(
        (res) =>
          res.data as {
            total?: number;
            thisMonth?: number;
            projectsCompleted?: number;
          }
      ),
    enabled: !!session?.id,
  });

  const { data: freelanceProfile } = useQuery({
    queryKey: ["freelance", "my-profile"],
    queryFn: () =>
      freelanceApi.getMyProfile().then(
        (res) =>
          res.data as {
            stats?: {
              reviewsCount?: number;
              avgRating?: number | null;
            };
          }
      ),
    enabled: !!session?.id,
  });

  const activeProposals = proposals.filter((proposal) =>
    ["ENVIADA", "EN_REVISION"].includes(String(proposal.status || ""))
  ).length;

  const stats = [
    {
      label: "Propuestas activas",
      value: String(activeProposals),
      icon: FolderKanban,
      trend: `${proposals.length} totales`,
    },
    {
      label: "Ingresos del mes",
      value: formatMoney(Number(earnings?.thisMonth || 0), "USD"),
      icon: Wallet,
      trend: `${Number(earnings?.projectsCompleted || 0)} proyectos completados`,
    },
    {
      label: `Reseñas (${Number(freelanceProfile?.stats?.avgRating || 0).toFixed(1)}★)`,
      value: String(Number(freelanceProfile?.stats?.reviewsCount || 0)),
      icon: Star,
      trend: "Calificación de clientes",
    },
  ];

  const visibleProposals = proposals.slice(0, 5);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[11px] font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Panel de Freelancer</p>
        <h1 className="mt-1 font-display text-3xl md:text-4xl font-bold text-foreground">Hola, {session?.name} 👋</h1>
        <p className="mt-2 text-muted-foreground font-sans">Tu negocio en una sola vista.</p>
      </header>

      <div className="grid sm:grid-cols-3 gap-4">
        {stats.map(s => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <s.icon className="h-5 w-5 text-primary" />
              <span className="text-[10px] font-subtitle font-semibold uppercase tracking-wider text-emerald-600">{s.trend}</span>
            </div>
            <p className="mt-4 font-display text-3xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1 font-sans">{s.label}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h2 className="font-subtitle font-semibold">Propuestas activas</h2>
          </div>
          <Link to="/app/freelancer/propuestas" className="text-xs font-subtitle font-semibold underline underline-offset-4">
            Ver todas
          </Link>
        </div>
        <ul className="divide-y divide-border">
          {proposalsLoading && (
            <li className="p-5 text-sm text-muted-foreground">Cargando propuestas...</li>
          )}
          {!proposalsLoading && visibleProposals.length === 0 && (
            <li className="p-5 text-sm text-muted-foreground">Aún no tienes propuestas registradas.</li>
          )}
          {!proposalsLoading && visibleProposals.map((proposal) => (
            <li key={proposal.id} className="p-5 flex items-center gap-4 hover:bg-surface-elevated/50">
              <div className="flex-1 min-w-0">
                <p className="font-subtitle font-semibold truncate">{proposal.project?.title || "Proyecto"}</p>
                <p className="text-xs text-muted-foreground font-sans">
                  {proposal.project?.client?.name || "Cliente"} · {formatMoney(Number(proposal.price || 0), proposal.currency || "USD")}
                </p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-surface-elevated font-subtitle">{STATUS_LABELS[proposal.status] || proposal.status}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </li>
          ))}
        </ul>
      </section>

      <div className="grid md:grid-cols-2 gap-4">
        <Link to="/app/freelancer/perfil" className="rounded-2xl border border-border bg-card p-5 hover:border-foreground transition-colors">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="mt-3 font-subtitle font-semibold">Mejora tu portafolio</h3>
          <p className="text-xs text-muted-foreground mt-1 font-sans">Agrega 2 proyectos para subir tu ranking.</p>
        </Link>
        <Link to="/app/freelancer/proyectos" className="rounded-2xl border border-border bg-card p-5 hover:border-foreground transition-colors">
          <FolderKanban className="h-5 w-5 text-primary" />
          <h3 className="mt-3 font-subtitle font-semibold">Explora proyectos abiertos</h3>
          <p className="text-xs text-muted-foreground mt-1 font-sans">Postúlate a nuevas oportunidades en minutos.</p>
        </Link>
      </div>
    </div>
  );
};

export default FreelancerDashboard;
