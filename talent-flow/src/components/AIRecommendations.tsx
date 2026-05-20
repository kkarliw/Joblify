import { useState } from "react";
import { Sparkles, Loader2, TrendingUp, Briefcase, Rocket } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { aiApi } from "@/lib/api";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type Recommendation = {
  id: string;
  score: number;
  reason: string;
};

type RecommendationsResponse = {
  recommendations: Recommendation[];
  message?: string;
};

export const AIRecommendations = ({ role }: { role: string }) => {
  const [requested, setRequested] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery<RecommendationsResponse>({
    queryKey: ["ai-recommendations", role],
    queryFn: async () => {
      const { data } = await aiApi.recommendations();
      return data as RecommendationsResponse;
    },
    staleTime: 1000 * 60 * 15,
    retry: 1,
    enabled: requested,
  });

  if (!requested) {
    return (
      <div className="rounded-2xl border border-border bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-subtitle font-semibold text-foreground">Recomendado para ti</h3>
        </div>
        <p className="text-sm text-muted-foreground font-sans mb-5">
          Ejecuta un análisis IA para ver las oportunidades más relevantes para tu perfil.
        </p>
        <button
          type="button"
          onClick={() => setRequested(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-foreground text-background px-4 py-2 text-sm font-subtitle font-semibold hover:bg-foreground/90 transition-colors"
        >
          <Sparkles className="h-4 w-4" />
          Generar recomendaciones con IA
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-subtitle font-semibold text-foreground">Recomendado para ti</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (isError || !data || data.recommendations.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-subtitle font-semibold text-foreground">Recomendado para ti</h3>
        </div>
        <p className="text-sm text-muted-foreground font-sans">
          {data?.message || "No hay recomendaciones disponibles en este momento"}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-subtitle font-semibold hover:bg-surface-elevated transition-colors"
        >
          <Sparkles className="h-4 w-4" />
          Reintentar análisis
        </button>
      </div>
    );
  }

  const getIcon = () => {
    if (role === "candidato" || role === "estudiante") return Briefcase;
    if (role === "emprendedor") return Rocket;
    return TrendingUp;
  };

  const Icon = getIcon();

  const getLink = (id: string) => {
    if (role === "candidato" || role === "estudiante") return `/vacantes/${id}`;
    if (role === "emprendedor") return `/startups/${id}`;
    return `/freelance/projects/${id}`;
  };

  return (
    <div className="rounded-2xl border border-border bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-subtitle font-semibold text-foreground">Recomendado para ti</h3>
        <span className="ml-auto text-xs text-muted-foreground font-sans">Powered by IA</span>
      </div>

      <div className="space-y-3">
        {data.recommendations.slice(0, 5).map((rec) => (
          <Link
            key={rec.id}
            to={getLink(rec.id)}
            className="block rounded-xl border border-border bg-surface-elevated p-4 transition-all hover:border-primary/40 hover:shadow-sm group"
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                "shrink-0 h-10 w-10 rounded-lg flex items-center justify-center transition-colors",
                rec.score >= 80 ? "bg-emerald-50 text-emerald-600" :
                rec.score >= 60 ? "bg-amber-50 text-amber-600" :
                "bg-blue-50 text-blue-600"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    "inline-flex items-center gap-1 text-xs font-subtitle font-bold px-2 py-0.5 rounded-full",
                    rec.score >= 80 ? "bg-emerald-100 text-emerald-700" :
                    rec.score >= 60 ? "bg-amber-100 text-amber-700" :
                    "bg-blue-100 text-blue-700"
                  )}>
                    {rec.score}% match
                  </span>
                </div>
                <p className="text-sm text-foreground font-sans leading-relaxed line-clamp-2">
                  {rec.reason}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {data.recommendations.length > 5 && (
        <Link
          to={role === "candidato" || role === "estudiante" ? "/vacantes" : role === "emprendedor" ? "/startups" : "/freelance/projects"}
          className="mt-4 block text-center text-sm font-subtitle font-semibold text-primary hover:underline"
        >
          Ver todas las recomendaciones →
        </Link>
      )}
    </div>
  );
};
