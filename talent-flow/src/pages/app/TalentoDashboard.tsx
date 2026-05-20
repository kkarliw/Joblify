import { Link } from "react-router-dom";
import { Briefcase, MessageSquare, TrendingUp, Eye, Target } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { AIRecommendations } from "@/components/AIRecommendations";

const stats = [
  { label: "Match score promedio", value: "92%", icon: Target, trend: "+4%" },
  { label: "Vistas a tu perfil", value: "184", icon: Eye, trend: "+22" },
  { label: "Aplicaciones activas", value: "7", icon: Briefcase, trend: "2 nuevas" },
];

const TalentoDashboard = () => {
  const user = useAuthStore((state) => state.user);
  return (
    <div className="space-y-8">
      <header>
        <p className="text-[11px] font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Panel de Talento</p>
        <h1 className="mt-1 font-display text-3xl md:text-4xl font-bold text-foreground">Hola, {user?.name || "Usuario"}</h1>
        <p className="mt-2 text-muted-foreground font-sans">Aquí tienes tus matches del día y qué hacer ahora.</p>
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

      <AIRecommendations role="candidato" />

      <div className="grid md:grid-cols-2 gap-4">
        <Link to="/app/talento/perfil" className="rounded-2xl border border-border bg-card p-5 hover:border-foreground transition-colors">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="mt-3 font-subtitle font-semibold">Completa tu perfil (78%)</h3>
          <p className="text-xs text-muted-foreground mt-1 font-sans">Sube tu CV y mejora tu match.</p>
        </Link>
        <Link to="/app/talento/mensajes" className="rounded-2xl border border-border bg-card p-5 hover:border-foreground transition-colors">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h3 className="mt-3 font-subtitle font-semibold">3 reclutadores te escribieron</h3>
          <p className="text-xs text-muted-foreground mt-1 font-sans">Responde para no perder oportunidades.</p>
        </Link>
      </div>
    </div>
  );
};

export default TalentoDashboard;
