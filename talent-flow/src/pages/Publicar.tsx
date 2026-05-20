import { useState } from "react";
import { Sparkles, Eye, MapPin } from "lucide-react";
import { PublicLayout as AppLayout } from "@/components/Layouts";
import { CompanyLogo } from "@/components/Brand";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { LoginRequiredDialog } from "@/components/LoginRequiredDialog";
import { useAuthStore } from "@/store/authStore";
import { hasRealSession } from "@/lib/session";
import { toast } from "sonner";

const Publicar = () => {
  const { user, token, refreshToken } = useAuthStore();
  const [title, setTitle] = useState("Senior Product Designer");
  const [desc, setDesc] = useState("");
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [loginTarget, setLoginTarget] = useState("/login");

  const isAuthenticated = hasRealSession(user, token, refreshToken);

  const requestLogin = (message: string) => {
    setLoginTarget(`/login?next=${encodeURIComponent(window.location.pathname)}`);
    setAuthDialogOpen(true);
    toast.info(message);
  };

  const handleSaveDraft = () => {
    if (!isAuthenticated) {
      requestLogin("Inicia sesión para guardar borradores");
      return;
    }

    toast.success("Borrador guardado");
  };

  const handlePublish = () => {
    if (!isAuthenticated) {
      requestLogin("Inicia sesión para publicar vacantes");
      return;
    }

    toast.success("Vacante publicada");
  };

  return (
    <AppLayout>
      <div>
        <h1 className="font-display text-3xl">Publicar vacante</h1>
        <p className="mt-2 text-muted-foreground">Crea una publicación atractiva con ayuda de IA.</p>
      </div>

      <div className="mt-8 grid lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Título del puesto</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} className="h-11 bg-surface-elevated border-transparent" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider">Modalidad</Label>
              <select aria-label="Modalidad" title="Modalidad" className="w-full h-11 rounded-md bg-surface-elevated px-3 text-sm">
                <option>Remoto</option><option>Híbrido</option><option>Presencial</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider">Tipo</Label>
              <select aria-label="Tipo" title="Tipo" className="w-full h-11 rounded-md bg-surface-elevated px-3 text-sm">
                <option>Full-time</option><option>Part-time</option><option>Freelance</option><option>Pasantía</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider">Ubicación</Label>
              <Input placeholder="Ciudad de México" className="h-11 bg-surface-elevated border-transparent" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider">Salario</Label>
              <Input placeholder="USD 4K – 6K" className="h-11 bg-surface-elevated border-transparent" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider">Descripción</Label>
              <button className="text-xs font-semibold flex items-center gap-1 text-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Generar con IA
              </button>
            </div>
            <Textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Describe el rol, responsabilidades y cultura…"
              className="min-h-40 bg-surface-elevated border-transparent resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Skills requeridas</Label>
            <Input placeholder="Figma, Research, DS" className="h-11 bg-surface-elevated border-transparent" />
          </div>

          {/* IA suggestions */}
          <div className="jb-card p-5 bg-primary/10 border-primary/30">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-primary" /> Sugerencias de IA
            </div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>· Considera mencionar diversidad y beneficios</li>
              <li>· Tu título es claro, podrías añadir el área (ej. "Growth")</li>
              <li>· Salario competitivo para LATAM, +12% sobre la media</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-3">
            <Button variant="outline" className="flex-1 h-11 rounded-full" onClick={handleSaveDraft}>Guardar borrador</Button>
            <Button className="flex-1 h-11 rounded-full bg-primary text-primary-foreground hover:bg-primary-hover font-semibold" onClick={handlePublish}>Publicar vacante</Button>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-24 self-start">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Eye className="h-3.5 w-3.5" /> Vista previa
          </div>
          <div className="jb-card p-7">
            <div className="flex items-start gap-4">
              <CompanyLogo initial="J" />
              <div>
                <h3 className="font-display text-xl leading-tight">{title || "Título de la vacante"}</h3>
                <p className="text-sm text-muted-foreground mt-1">Tu Empresa</p>
                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Ciudad de México</span>
                  <span>·</span><span>Remoto</span>
                </div>
              </div>
            </div>
            <p className="mt-5 text-sm text-muted-foreground leading-relaxed min-h-20">
              {desc || "Aquí aparecerá la descripción de tu vacante…"}
            </p>
          </div>
        </div>
      </div>

      <LoginRequiredDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        description="Para publicar vacantes, primero inicia sesión con una cuenta de empresa."
        loginTo={loginTarget}
      />
    </AppLayout>
  );
};

export default Publicar;
