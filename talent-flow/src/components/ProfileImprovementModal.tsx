import { useState } from "react";
import { Sparkles, Loader2, TrendingUp, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { aiApi } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

type Suggestion = {
  field: string;
  tip: string;
  impact: "alto" | "medio" | "bajo";
};

type ImprovementResponse = {
  suggestions: Suggestion[];
};

export const ProfileImprovementModal = ({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void;
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const improveMutation = useMutation({
    mutationFn: () => aiApi.improveProfile(),
    onSuccess: (response) => {
      const data = response.data as ImprovementResponse;
      setSuggestions(data.suggestions || []);
    },
    onError: () => {
      setSuggestions([]);
    },
  });

  const handleAnalyze = () => {
    improveMutation.mutate();
  };

  const getImpactColor = (impact: string) => {
    if (impact === "alto") return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (impact === "medio") return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-blue-600 bg-blue-50 border-blue-200";
  };

  const getImpactIcon = (impact: string) => {
    if (impact === "alto") return TrendingUp;
    if (impact === "medio") return AlertCircle;
    return Sparkles;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="font-subtitle font-semibold text-lg">Mejorar perfil con IA</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="h-8 w-8 rounded-lg hover:bg-surface-elevated flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {!improveMutation.isSuccess && !improveMutation.isPending && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mb-4">
                <Sparkles className="h-8 w-8" />
              </div>
              <h3 className="font-subtitle font-semibold text-foreground mb-2">
                Analiza tu perfil con IA
              </h3>
              <p className="text-sm text-muted-foreground font-sans mb-6 max-w-md mx-auto">
                Nuestra IA analizará tu perfil y te dará sugerencias específicas para mejorarlo y aumentar tus chances de match.
              </p>
              <Button
                onClick={handleAnalyze}
                className="h-11 px-6 bg-foreground text-background hover:bg-foreground/90 rounded-xl font-subtitle font-semibold"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Analizar ahora
              </Button>
            </div>
          )}

          {improveMutation.isPending && (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-sm text-muted-foreground font-sans">
                Analizando tu perfil con IA...
              </p>
            </div>
          )}

          {improveMutation.isSuccess && suggestions.length > 0 && (
            <div className="space-y-4">
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
                <p className="text-sm font-sans text-foreground">
                  <strong className="font-subtitle font-semibold">Análisis completado.</strong> Aquí tienes {suggestions.length} sugerencias para mejorar tu perfil:
                </p>
              </div>

              {suggestions.map((suggestion, i) => {
                const Icon = getImpactIcon(suggestion.impact);
                return (
                  <div
                    key={i}
                    className={cn(
                      "rounded-xl border p-4 transition-all hover:shadow-sm",
                      getImpactColor(suggestion.impact)
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 h-10 w-10 rounded-lg bg-white/50 flex items-center justify-center">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-subtitle font-semibold text-sm">
                            {suggestion.field}
                          </h4>
                          <span className="text-xs font-subtitle font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/50">
                            {suggestion.impact === "alto" ? "Alto impacto" : 
                             suggestion.impact === "medio" ? "Medio impacto" : 
                             "Bajo impacto"}
                          </span>
                        </div>
                        <p className="text-sm font-sans leading-relaxed">
                          {suggestion.tip}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="pt-4 flex justify-end">
                <Button
                  onClick={onClose}
                  className="h-11 px-6 bg-foreground text-background hover:bg-foreground/90 rounded-xl font-subtitle font-semibold"
                >
                  Entendido
                </Button>
              </div>
            </div>
          )}

          {improveMutation.isError && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-50 text-red-600 mb-4">
                <AlertCircle className="h-8 w-8" />
              </div>
              <h3 className="font-subtitle font-semibold text-foreground mb-2">
                Error al analizar
              </h3>
              <p className="text-sm text-muted-foreground font-sans mb-6">
                No pudimos analizar tu perfil. Intenta de nuevo en unos momentos.
              </p>
              <Button
                onClick={handleAnalyze}
                variant="outline"
                className="h-11 px-6 rounded-xl font-subtitle font-semibold"
              >
                Reintentar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
