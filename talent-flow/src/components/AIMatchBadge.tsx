import { useState } from "react";
import { Sparkles, Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { aiApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type AIMatchResult = {
  score: number;
  reasons: string[];
  gaps?: string[];
  recommendation?: string;
};

export const AIMatchBadge = ({ jobId, size = "md" }: { jobId: string; size?: "sm" | "md" | "lg" }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [requested, setRequested] = useState(false);

  const { data: match, isLoading, isError, refetch } = useQuery<AIMatchResult>({
    queryKey: ["ai-match", jobId],
    queryFn: async () => {
      const { data } = await aiApi.match(jobId);
      return data as AIMatchResult;
    },
    staleTime: 1000 * 60 * 10,
    retry: 1,
    enabled: requested,
  });

  if (!requested) {
    return (
      <button
        type="button"
        onClick={() => setRequested(true)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-background/30 bg-background/10 text-background transition-all hover:bg-background/20",
          size === "sm" && "text-xs px-2 py-1",
          size === "md" && "text-sm px-3 py-1.5",
          size === "lg" && "text-base px-4 py-2"
        )}
      >
        <Sparkles className={cn("h-3 w-3", size === "lg" && "h-4 w-4")} />
        <span className="font-subtitle font-semibold">Analizar con IA</span>
      </button>
    );
  }

  if (isLoading) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-surface-elevated px-3 py-1 font-subtitle font-semibold",
          size === "sm" && "text-xs px-2 py-0.5",
          size === "lg" && "text-base px-4 py-2"
        )}
      >
        <Loader2 className={cn("h-3 w-3 animate-spin", size === "lg" && "h-4 w-4")} />
        <span className="text-muted-foreground">Analizando...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <button
        type="button"
        onClick={() => refetch()}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 text-amber-700 transition-all hover:bg-amber-100",
          size === "sm" && "text-xs px-2 py-0.5",
          size === "md" && "text-sm px-3 py-1",
          size === "lg" && "text-base px-4 py-2"
        )}
      >
        <Sparkles className={cn("h-3 w-3", size === "lg" && "h-4 w-4")} />
        <span className="font-subtitle font-semibold">Reintentar análisis</span>
      </button>
    );
  }

  if (!match) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (score >= 60) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excelente match";
    if (score >= 80) return "Muy buen match";
    if (score >= 70) return "Buen match";
    if (score >= 60) return "Match moderado";
    return "Match bajo";
  };

  return (
    <TooltipProvider>
      <Tooltip open={showDetails} onOpenChange={setShowDetails}>
        <TooltipTrigger asChild>
          <button
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border transition-all hover:scale-105",
              getScoreColor(match.score),
              size === "sm" && "text-xs px-2 py-0.5",
              size === "md" && "text-sm px-3 py-1",
              size === "lg" && "text-base px-4 py-2"
            )}
            onClick={() => setShowDetails(!showDetails)}
          >
            <Sparkles className={cn("h-3 w-3", size === "lg" && "h-4 w-4")} />
            <span className="font-subtitle font-bold">{match.score}%</span>
            {size !== "sm" && <span className="font-subtitle font-medium">match</span>}
            <Info className={cn("h-3 w-3 opacity-60", size === "lg" && "h-4 w-4")} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-sm p-4 bg-white border border-border shadow-lg">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h4 className="font-subtitle font-semibold text-sm">{getScoreLabel(match.score)}</h4>
            </div>

            {match.reasons && match.reasons.length > 0 && (
              <div>
                <p className="text-xs font-subtitle font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Por qué encajas:
                </p>
                <ul className="space-y-1">
                  {match.reasons.map((reason, i) => (
                    <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {match.gaps && match.gaps.length > 0 && (
              <div>
                <p className="text-xs font-subtitle font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Áreas de mejora:
                </p>
                <ul className="space-y-1">
                  {match.gaps.map((gap, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span>{gap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {match.recommendation && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-foreground italic">{match.recommendation}</p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
