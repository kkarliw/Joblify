import { useEffect, useState } from "react";
import { Briefcase, MapPin, Star, Award, Pencil, Plus, Save, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useAuthStore } from "@/store/authStore";
import { userApi } from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ProfilePageNew = () => {
  const { user, setUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    headline: user?.headline || "",
    bio: user?.bio || "",
    location: user?.location || "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        headline: user.headline || "",
        bio: user.bio || "",
        location: user.location || "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await userApi.updateMe(form);
      setUser(data);
      toast.success("Perfil actualizado");
      setEditing(false);
    } catch {
      toast.error("Error al guardar cambios");
    } finally {
      setSaving(false);
    }
  };

  const completion = user?.profileCompletion || 0;
  const completionColor = completion >= 80 ? "bg-green-500" : completion >= 50 ? "bg-primary" : "bg-orange-500";

  return (
    <div>
      <PageHeader
        eyebrow="Perfil"
        title="Mi perfil"
        subtitle="Así te ven empresas y otros usuarios en la red."
        action={
          editing ? (
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-border bg-card text-sm font-subtitle font-semibold hover:border-foreground"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-foreground text-background text-sm font-subtitle font-semibold hover:bg-foreground/90"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Guardar</>}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-border bg-card text-sm font-subtitle font-semibold hover:border-foreground"
            >
              <Pencil className="h-4 w-4" /> Editar
            </button>
          )
        }
      />

      <div className="space-y-6">
        {/* Barra de completado */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-subtitle font-semibold text-lg">Completitud del perfil</div>
              <div className="text-sm text-muted-foreground font-sans mt-0.5">
                {completion < 50 && "Completa tu perfil para mejorar tu visibilidad"}
                {completion >= 50 && completion < 80 && "Buen progreso. Sigue completando para destacar más"}
                {completion >= 80 && "Perfil completo. Las empresas te verán con más frecuencia"}
              </div>
            </div>
            <div className="text-3xl font-display font-bold text-primary">{completion}%</div>
          </div>
          <div className="h-2 rounded-full bg-surface-elevated overflow-hidden">
            <div className={`h-full rounded-full transition-all ${completionColor}`} style={{ width: `${completion}%` }} />
          </div>
          {completion < 100 && (
            <div className="mt-4 text-xs text-muted-foreground font-sans">
              Agrega experiencia, educación y skills para llegar al 100%
            </div>
          )}
        </div>

        {/* Datos básicos */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="h-32 bg-gradient-to-br from-primary/30 to-primary/5" />
          <div className="p-6">
            <div className="flex items-start gap-6">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl -mt-12 border-4 border-card">
                {user?.name?.[0] || "U"}
              </div>
              <div className="flex-1 pt-2">
                <h2 className="font-display text-2xl font-bold">{user?.name || "Usuario"}</h2>
                {editing ? (
                  <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Título profesional</Label>
                      <Input
                        value={form.headline}
                        onChange={(e) => setForm({ ...form, headline: e.target.value })}
                        placeholder="Senior Product Designer"
                        className="h-11 bg-surface-elevated border-transparent rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Ubicación</Label>
                      <Input
                        value={form.location}
                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                        placeholder="Bogotá, Colombia"
                        className="h-11 bg-surface-elevated border-transparent rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Bio</Label>
                      <textarea
                        value={form.bio}
                        onChange={(e) => setForm({ ...form, bio: e.target.value })}
                        placeholder="Cuéntanos sobre ti..."
                        className="w-full h-24 px-4 py-3 text-sm bg-surface-elevated border-transparent rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 font-sans"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="mt-2 text-muted-foreground font-sans">{user?.headline || "Agrega tu título profesional"}</p>
                    <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground font-sans">
                      {user?.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {user.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        {user?.role || "Talento"}
                      </span>
                    </div>
                    {user?.bio && (
                      <p className="mt-4 text-sm text-foreground font-sans leading-relaxed">{user.bio}</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-subtitle font-semibold text-lg">Skills</h3>
            <button className="inline-flex items-center gap-1.5 text-xs text-primary font-subtitle font-semibold hover:underline">
              <Plus className="h-3.5 w-3.5" /> Agregar
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {["React", "TypeScript", "Figma", "Node.js", "Product Design"].map((s) => (
              <span key={s} className="px-3 py-1.5 rounded-full bg-primary/15 text-sm font-sans">
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Experiencia */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-subtitle font-semibold text-lg">Experiencia</h3>
            <button className="inline-flex items-center gap-1.5 text-xs text-primary font-subtitle font-semibold hover:underline">
              <Plus className="h-3.5 w-3.5" /> Agregar
            </button>
          </div>
          <div className="space-y-4">
            {[
              { title: "Senior Product Designer", company: "Rappi", period: "2021 - Presente", desc: "Liderazgo de diseño para productos B2B." },
              { title: "Product Designer", company: "Nubank", period: "2019 - 2021", desc: "Diseño de experiencias fintech para LATAM." },
            ].map((e) => (
              <div key={e.title} className="flex gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                  {e.company[0]}
                </div>
                <div className="flex-1">
                  <div className="font-subtitle font-semibold">{e.title}</div>
                  <div className="text-sm text-muted-foreground font-sans">{e.company} · {e.period}</div>
                  <p className="mt-1 text-sm text-foreground font-sans">{e.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Educación */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-subtitle font-semibold text-lg">Educación</h3>
            <button className="inline-flex items-center gap-1.5 text-xs text-primary font-subtitle font-semibold hover:underline">
              <Plus className="h-3.5 w-3.5" /> Agregar
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Award className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-subtitle font-semibold">Diseño Industrial</div>
                <div className="text-sm text-muted-foreground font-sans">Universidad de los Andes · 2015 - 2019</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePageNew;
