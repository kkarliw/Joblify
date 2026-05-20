import { useState, useCallback } from "react";
import { Upload, FileText, Loader2, Sparkles, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { profileApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type CVAnalysis = {
  headline: string;
  bio: string;
  skills: string[];
  experienceYears: number;
  recommendation: string;
};

type CVUploaderProps = {
  onAnalysisComplete?: (analysis: CVAnalysis) => void;
  onApplyData?: (data: CVAnalysis) => void;
  className?: string;
};

export const CVUploader = ({ onAnalysisComplete, onApplyData, className }: CVUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<CVAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") {
      setError("Solo se permiten archivos PDF");
      toast.error("Solo se permiten archivos PDF");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("El archivo no debe superar 5MB");
      toast.error("El archivo no debe superar 5MB");
      return;
    }

    setError(null);
    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      const { data } = await profileApi.uploadCV(file);
      const aiAnalysis = data.aiAnalysis as CVAnalysis;
      
      setAnalysis(aiAnalysis);
      toast.success("CV analizado con IA exitosamente");
      
      if (onAnalysisComplete) {
        onAnalysisComplete(aiAnalysis);
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Error analizando el CV";
      setError(message);
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  }, [onAnalysisComplete]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleApplyData = () => {
    if (analysis && onApplyData) {
      onApplyData(analysis);
      toast.success("Datos aplicados a tu perfil");
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className={cn(
          "relative rounded-2xl border-2 border-dashed transition-all",
          isDragging ? "border-primary bg-primary/5" : "border-border bg-white",
          isAnalyzing && "pointer-events-none opacity-60"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          accept=".pdf"
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isAnalyzing}
        />
        
        <div className="p-8 text-center">
          {isAnalyzing ? (
            <div className="space-y-3">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <div>
                <p className="font-subtitle font-semibold text-foreground">Analizando tu CV con IA...</p>
                <p className="text-xs text-muted-foreground mt-1 font-sans">
                  Esto puede tomar hasta 30 segundos
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary">
                <Upload className="h-7 w-7" />
              </div>
              <div>
                <p className="font-subtitle font-semibold text-foreground">
                  Arrastra tu CV aquí o haz click para seleccionar
                </p>
                <p className="text-xs text-muted-foreground mt-1 font-sans">
                  PDF hasta 5MB · La IA extraerá automáticamente tus datos
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-subtitle font-semibold text-red-900">Error al procesar</p>
            <p className="text-xs text-red-700 mt-0.5 font-sans">{error}</p>
          </div>
        </div>
      )}

      {analysis && (
        <div className="rounded-2xl border border-border bg-white p-6 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <h3 className="font-subtitle font-semibold text-foreground">Análisis completado</h3>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs font-subtitle font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Título profesional
              </p>
              <p className="text-sm text-foreground font-sans">{analysis.headline}</p>
            </div>

            <div>
              <p className="text-xs font-subtitle font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Resumen
              </p>
              <p className="text-sm text-foreground font-sans leading-relaxed">{analysis.bio}</p>
            </div>

            <div>
              <p className="text-xs font-subtitle font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Skills detectadas
              </p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.skills.map((skill, i) => (
                  <span key={i} className="text-xs font-medium px-2.5 py-1 rounded-md bg-primary/15 font-sans">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-subtitle font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Años de experiencia
              </p>
              <p className="text-sm text-foreground font-sans">{analysis.experienceYears} años</p>
            </div>

            {analysis.recommendation && (
              <div className="pt-3 border-t border-border">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-subtitle font-semibold text-foreground mb-1">
                      Recomendación IA
                    </p>
                    <p className="text-xs text-muted-foreground font-sans italic">
                      {analysis.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {onApplyData && (
            <Button
              onClick={handleApplyData}
              className="w-full h-10 bg-foreground text-background hover:bg-foreground/90 rounded-xl font-subtitle font-semibold"
            >
              <FileText className="h-4 w-4 mr-2" />
              Aplicar estos datos a mi perfil
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
