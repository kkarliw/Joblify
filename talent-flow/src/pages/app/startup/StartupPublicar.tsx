import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Lightbulb, Loader2, Sparkles } from "lucide-react";
import { aiApi, startupApi } from "@/lib/api";

const STAGE_OPTIONS = [
  { value: "Idea", label: "Idea inicial" },
  { value: "MVP", label: "Producto inicial (MVP)" },
  { value: "Seed", label: "Primeras ventas (Seed)" },
  { value: "Serie A", label: "Crecimiento (Serie A)" },
  { value: "Serie B", label: "Expansión (Serie B)" },
] as const;

type StartupStage = (typeof STAGE_OPTIONS)[number]["value"];

const StartupPublicar = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [sector, setSector] = useState("");
  const [stage, setStage] = useState<StartupStage>("Idea");
  const [website, setWebsite] = useState("");
  const [roles, setRoles] = useState("");
  const [deckUrl, setDeckUrl] = useState("");
  const [pitchLoading, setPitchLoading] = useState(false);

  const createStartup = useMutation({
    mutationFn: (payload: Record<string, unknown>) => startupApi.create(payload),
    onSuccess: () => {
      toast.success("Proyecto publicado correctamente");
      navigate("/app/startup/proyectos");
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "No se pudo publicar el proyecto";
      toast.error(message);
    },
  });

  const handleGeneratePitch = async () => {
    if (!name.trim()) {
      toast.error("Completa al menos el nombre del proyecto para generar el pitch");
      return;
    }
    setPitchLoading(true);
    try {
      const rolesList = roles
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const normalizedDescription = description.trim();
      const aiDescription =
        normalizedDescription ||
        "El usuario no proporcionó descripción detallada. Genera un pitch claro usando nombre, etapa, industria y roles.";

      const { data } = await aiApi.generatePitch({
        name: name.trim(),
        description: aiDescription,
        stage,
        sector: sector.trim() || undefined,
        roles: rolesList.length ? rolesList : undefined,
      });

      const resolvedTagline = typeof data?.tagline === "string" && data.tagline.trim() ? data.tagline.trim() : "";
      const resolvedPitch = typeof data?.pitch === "string" && data.pitch.trim() ? data.pitch.trim() : "";
      const resolvedCta = typeof data?.cta === "string" && data.cta.trim() ? data.cta.trim() : "";
      const correctedTitle = typeof data?.title === "string" && data.title.trim() ? data.title.trim() : "";
      const correctedIndustry = typeof data?.industry === "string" && data.industry.trim() ? data.industry.trim() : "";

      if (!resolvedTagline || !resolvedPitch || !resolvedCta) {
        throw new Error("La IA devolvió una respuesta incompleta para el pitch.");
      }

      if (correctedTitle) setName(correctedTitle);
      if (correctedIndustry) setSector(correctedIndustry);
      setTagline(resolvedTagline);
      setDescription(`${resolvedPitch}\n\n${resolvedCta}`);
      toast.success("Pitch generado");
    } catch (err) {
      const timeoutMessage =
        (err as { code?: string })?.code === "ECONNABORTED" ||
        (err instanceof Error && err.message.toLowerCase().includes("timeout"));
      const apiMessage = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      const localMessage = err instanceof Error ? err.message : "No se pudo generar el pitch con IA";
      toast.error(
        timeoutMessage
          ? "La IA tardó demasiado en responder. Verifica que Ollama esté activo y vuelve a intentar."
          : apiMessage || localMessage,
      );
    } finally {
      setPitchLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const rawRoles = roles
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const openRoles = rawRoles.map((title) => ({
      title,
      description: `Rol abierto para ${title} en etapa ${stage}.`,
    }));

    createStartup.mutate({
      name,
      tagline,
      description,
      sector: sector || undefined,
      stage,
      website: website || undefined,
      openRoles,
      deckUrl: deckUrl || undefined,
    });
  };

  return (
    <div>
      <PageHeader eyebrow="Nuevo proyecto" title="Publica tu startup" subtitle="Cuéntanos en qué estás trabajando para encontrar cofundadores y colaboradores." />
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-border bg-card p-6 space-y-5 max-w-3xl"
      >
        <div className="space-y-2">
          <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Nombre del proyecto</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej. HealthOS" className="h-12 bg-surface-elevated border-transparent rounded-xl" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Industria</Label>
            <Input value={sector} onChange={(e) => setSector(e.target.value)} placeholder="Fintech, SaaS, Health…" className="h-12 bg-surface-elevated border-transparent rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Etapa</Label>
            <select
              id="startup-stage"
              title="Etapa de la startup"
              aria-label="Etapa de la startup"
              value={stage}
              onChange={(e) => setStage(e.target.value as StartupStage)}
              className="h-12 w-full bg-surface-elevated border-transparent rounded-xl px-3 text-sm"
            >
              {STAGE_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Tagline</Label>
          <Input
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="Ej. Pagos B2B cross-border para LATAM"
            className="h-12 bg-surface-elevated border-transparent rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Descripción</Label>
          <Textarea
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe el problema, tu solución y estado actual del proyecto"
            className="bg-surface-elevated border-transparent rounded-xl"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Roles que buscas (separados por coma)</Label>
            <Input value={roles} onChange={(e) => setRoles(e.target.value)} placeholder="CTO, Diseñador, Growth…" className="h-12 bg-surface-elevated border-transparent rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Sitio web</Label>
            <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://tu-startup.com" className="h-12 bg-surface-elevated border-transparent rounded-xl" />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Pitch deck (URL opcional)</Label>
          <Input value={deckUrl} onChange={(e) => setDeckUrl(e.target.value)} placeholder="https://mi-pitch.com" className="h-12 bg-surface-elevated border-transparent rounded-xl" />
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <button
            type="button"
            onClick={handleGeneratePitch}
            disabled={pitchLoading}
            className="inline-flex items-center gap-2 text-xs font-subtitle font-semibold text-foreground disabled:opacity-50"
          >
            {pitchLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-primary" />} Generar pitch con IA
          </button>
          <Button type="submit" disabled={createStartup.isPending} className="h-11 px-6 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-subtitle font-semibold">
            <Lightbulb className="h-4 w-4" /> Publicar proyecto
          </Button>
        </div>
      </form>
    </div>
  );
};

export default StartupPublicar;
