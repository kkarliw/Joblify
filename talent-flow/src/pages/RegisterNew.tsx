import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, ArrowLeft, Check, Sparkles, MapPin, Mail, Lock, User, Loader2, Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAuthStore, homeForRole, type UserRole } from "@/store/authStore";
import { userApi } from "@/lib/api";
import { toast } from "sonner";

type RoleKey = "candidato" | "empresa" | "freelancer" | "emprendedor" | "estudiante";

const ROLE_LABELS: Record<RoleKey, string> = {
  candidato: "Talento",
  empresa: "Empresa",
  freelancer: "Freelancer",
  emprendedor: "Emprendedor",
  estudiante: "Estudiante",
};

const ROLE_TO_BACKEND: Record<RoleKey, UserRole> = {
  candidato: "candidato",
  empresa: "empresa",
  freelancer: "freelancer",
  emprendedor: "emprendedor",
  estudiante: "estudiante",
};

const SKILLS: Record<RoleKey, string[]> = {
  candidato: ["React", "TypeScript", "Python", "Figma", "SQL", "Node.js", "AWS", "Docker", "Product Design", "Data Analysis", "UX Research", "Swift", "Kotlin", "Marketing Digital", "Ventas B2B", "Scrum", "Jira", "Git", "CI/CD", "GraphQL"],
  empresa: ["Reclutamiento IT", "Employer Branding", "ATS", "Entrevistas", "Onboarding", "RRHH", "Compensacion", "Desarrollo Organizacional", "People Analytics", "Laboral"],
  freelancer: ["Diseno UI/UX", "Branding", "Desarrollo Web", "SEO", "Copywriting", "Edicion de Video", "Fotografia", "Ilustracion", "Motion Graphics", "3D", "WordPress", "Shopify", "Email Marketing", "Social Media"],
  emprendedor: ["Product Management", "Growth Hacking", "Fundraising", "Ventas B2B", "Estrategia", "Liderazgo", "Marketing Digital", "Finanzas", "Legal Startups", "Pitch Deck"],
  estudiante: ["React", "Python", "Java", "C++", "Analisis de Datos", "Excel", "Figma", "Marketing", "Ingles", "Comunicacion", "Trabajo en Equipo", "Liderazgo"],
};

const PHASES = ["Cuenta", "Perfil", "Skills", "Preferencias", "Listo"];

const RegisterNew = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const role = params.get("role") as RoleKey | null;
  const { user } = useAuthStore();
  const [phase, setPhase] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [f, setF] = useState({
    name: "",
    email: "",
    password: "",
    headline: "",
    location: "",
    bio: "",
    modality: "",
    salary: "",
    availability: "",
    company: "",
    industry: "",
    size: "",
    career: "",
    institution: "",
    semester: "",
    project: "",
    stage: "",
    seeking: "",
  });

  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const toggleSkill = (s: string) => setSkills((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));

  // Verificar que el rol sea válido
  const validRoles: RoleKey[] = ["candidato", "empresa", "freelancer", "emprendedor", "estudiante"];
  if (!role || !validRoles.includes(role)) {
    return <Navigate to="/register/elegir" replace />;
  }
  if (user) return <Navigate to={homeForRole(user.role.toLowerCase() as UserRole)} replace />;

  const getValidationError = () => {
    if (phase === 0) {
      if (!f.name?.trim()) return "El nombre es requerido";
      if (f.name.length < 2) return "El nombre debe tener mínimo 2 caracteres";
      if (!f.email?.trim()) return "El email es requerido";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) return "Email inválido";
      if (!f.password) return "La contraseña es requerida";
      if (f.password.length < 8) return "La contraseña debe tener mínimo 8 caracteres";
      return null;
    }
    if (phase === 1) {
      if (!f.headline?.trim()) return "El título profesional es requerido";
      if (!f.location?.trim()) return "La ubicación es requerida";
      return null;
    }
    if (phase === 2) {
      if (skills.length === 0) return "Selecciona al menos 1 skill";
      return null;
    }
    return null;
  };

  const canNext = () => {
    return getValidationError() === null;
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const response = await fetch("http://localhost:4000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: f.email,
          password: f.password,
          name: f.name,
          role: ROLE_TO_BACKEND[role],
          headline: f.headline || undefined,
          location: f.location || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al registrar");
      }

      const data = await response.json();
      const normalizedUser = { ...data.user, role: data.user.role.toLowerCase() };
      
      localStorage.setItem("joblify.token", data.accessToken);
      localStorage.setItem("joblify.refresh", data.refreshToken);

      useAuthStore.setState({
        user: normalizedUser,
        token: data.accessToken,
        refreshToken: data.refreshToken,
        onboardingDone: true,
      });

      toast.success("Bienvenido a Joblify");
      navigate(homeForRole(normalizedUser.role.toLowerCase() as UserRole), { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  // Si el rol es inválido, mostrar mensaje de error en lugar de crashear
  if (!role || !ROLE_LABELS[role]) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">Error: Rol no válido</h1>
          <p className="text-muted-foreground mb-6">El rol "{role}" no es válido.</p>
          <Button asChild>
            <Link to="/register/elegir">Volver a seleccionar rol</Link>
          </Button>
        </div>
      </div>
    );
  }

  const label = ROLE_LABELS[role];
  const skillsList = SKILLS[role];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="h-16 border-b border-border flex items-center px-6 lg:px-10 shrink-0">
        <Logo size="md" />
        <div className="ml-auto flex items-center gap-3">
          <div className="text-xs text-muted-foreground font-sans">
            Paso {phase + 1} de {PHASES.length}
          </div>
          <span className="text-xs font-subtitle font-semibold uppercase tracking-wider bg-primary/10 text-primary px-3 py-1 rounded-full">
            {label}
          </span>
        </div>
      </header>

      <div className="flex-1 grid lg:grid-cols-[1fr_1fr] min-h-0">
        <div className="hidden lg:flex flex-col justify-between p-10 bg-white border-r border-border">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-foreground text-background text-[11px] font-subtitle font-semibold uppercase tracking-wider">
              <Sparkles className="h-3 w-3" /> Onboarding Joblify
            </span>
            <h1 className="mt-4 font-display text-4xl font-bold text-foreground leading-tight">
              {label} en Joblify, a tu manera.
            </h1>
            <p className="mt-3 text-sm text-muted-foreground font-sans">
              Completa estos pasos para personalizar tu experiencia. Toma menos de 2 minutos.
            </p>
          </div>
          <div className="mt-auto space-y-2">
            <div className="flex items-center gap-2 text-sm font-subtitle font-semibold">
              <Check className="h-4 w-4 text-primary" /> Matching con IA
            </div>
            <div className="flex items-center gap-2 text-sm font-subtitle font-semibold">
              <Check className="h-4 w-4 text-primary" /> Roles personalizados
            </div>
            <div className="flex items-center gap-2 text-sm font-subtitle font-semibold">
              <Check className="h-4 w-4 text-primary" /> Perfil público optimizado
            </div>
          </div>
        </div>

        <div className="p-6 lg:p-10 overflow-y-auto">
          <div className="flex gap-2 mb-8">
            {PHASES.map((p, i) => (
              <div
                key={p}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-all",
                  i <= phase ? "bg-primary" : "bg-surface-elevated"
                )}
              />
            ))}
          </div>

          {phase === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">Crea tu cuenta</h2>
                <p className="text-sm text-muted-foreground font-sans mt-1">Usa tu email laboral o personal.</p>
              </div>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Nombre completo</Label>
                  <div className="relative">
                    <User className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input className="h-12 pl-10 bg-surface-elevated border-transparent rounded-xl" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Andrea Gómez" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Email</Label>
                  <div className="relative">
                    <Mail className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input className="h-12 pl-10 bg-surface-elevated border-transparent rounded-xl" type="email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="tu@email.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Contraseña</Label>
                  <div className="relative">
                    <Lock className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input className="h-12 pl-10 pr-10 bg-surface-elevated border-transparent rounded-xl" type={showPw ? "text" : "password"} value={f.password} onChange={(e) => set("password", e.target.value)} placeholder="Mínimo 8 caracteres" />
                    <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-2.5 text-muted-foreground">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {phase === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">Tu perfil</h2>
                <p className="text-sm text-muted-foreground font-sans mt-1">Esto aparece en tu tarjeta pública.</p>
              </div>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Título profesional</Label>
                  <Input className="h-12 bg-surface-elevated border-transparent rounded-xl" value={f.headline} onChange={(e) => set("headline", e.target.value)} placeholder="Senior Product Designer" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Ubicación</Label>
                  <div className="relative">
                    <MapPin className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input className="h-12 pl-10 bg-surface-elevated border-transparent rounded-xl" value={f.location} onChange={(e) => set("location", e.target.value)} placeholder="Bogotá, Colombia" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Bio breve</Label>
                  <textarea className="w-full h-24 px-4 py-3 text-sm bg-surface-elevated border-transparent rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 font-sans" value={f.bio} onChange={(e) => set("bio", e.target.value)} placeholder="Cuéntanos sobre ti y qué buscas" />
                </div>
              </div>
            </div>
          )}

          {phase === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground">Skills principales</h2>
                  <p className="text-sm text-muted-foreground font-sans mt-1">Selecciona al menos una.</p>
                </div>
                <span className="text-xs font-subtitle font-semibold uppercase tracking-wider bg-primary/10 text-primary px-3 py-1 rounded-full">
                  {skills.length} seleccionadas
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {skillsList.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSkill(s)}
                    className={cn(
                      "px-3 py-2 rounded-full text-sm font-sans border transition-all",
                      skills.includes(s)
                        ? "bg-foreground text-background border-foreground"
                        : "border-border hover:border-foreground"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {phase === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">Preferencias</h2>
                <p className="text-sm text-muted-foreground font-sans mt-1">Personaliza tu experiencia según tu rol.</p>
              </div>

              {role === "candidato" && (
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Modalidad</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {["Remoto", "Híbrido", "Presencial"].map((m) => (
                        <button key={m} type="button" onClick={() => set("modality", m)} className={cn("h-11 rounded-xl border text-sm font-subtitle font-medium transition-all", f.modality === m ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground")}>{m}</button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Salario esperado (USD/mes)</Label>
                    <Input className="h-12 bg-surface-elevated border-transparent rounded-xl" type="number" value={f.salary} onChange={(e) => set("salary", e.target.value)} placeholder="3000" />
                  </div>
                </div>
              )}

              {role === "freelancer" && (
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Disponibilidad</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {["Tiempo completo", "Medio tiempo", "Por proyecto"].map((d) => (
                        <button key={d} type="button" onClick={() => set("availability", d)} className={cn("h-11 rounded-xl border text-sm font-subtitle font-medium transition-all", f.availability === d ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground")}>{d}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {role === "empresa" && (
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Nombre de la empresa</Label>
                    <Input className="h-12 bg-surface-elevated border-transparent rounded-xl" value={f.company} onChange={(e) => set("company", e.target.value)} placeholder="Tu empresa" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Industria</Label>
                    <Input className="h-12 bg-surface-elevated border-transparent rounded-xl" value={f.industry} onChange={(e) => set("industry", e.target.value)} placeholder="Fintech, SaaS, E-commerce" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Tamaño</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {["1-10", "11-50", "51-200", "201-500", "500+"].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => set("size", s)}
                          className={cn(
                            "h-11 rounded-xl border text-sm font-subtitle font-medium transition-all",
                            f.size === s ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {role === "emprendedor" && (
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Nombre del proyecto</Label>
                    <Input className="h-12 bg-surface-elevated border-transparent rounded-xl" value={f.project} onChange={(e) => set("project", e.target.value)} placeholder="HealthOS, FinAI" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Etapa</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {["Idea", "MVP", "Seed", "Serie A"].map((s) => (
                        <button key={s} type="button" onClick={() => set("stage", s)} className={cn("h-11 rounded-xl border text-sm font-subtitle font-medium transition-all", f.stage === s ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground")}>{s}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {role === "estudiante" && (
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Carrera</Label>
                    <Input className="h-12 bg-surface-elevated border-transparent rounded-xl" value={f.career} onChange={(e) => set("career", e.target.value)} placeholder="Ingeniería de Sistemas" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Institución</Label>
                    <Input className="h-12 bg-surface-elevated border-transparent rounded-xl" value={f.institution} onChange={(e) => set("institution", e.target.value)} placeholder="UNAM, Uniandes, ITESM" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Semestre</Label>
                    <Input className="h-12 bg-surface-elevated border-transparent rounded-xl" type="number" value={f.semester} onChange={(e) => set("semester", e.target.value)} placeholder="7" />
                  </div>
                </div>
              )}
            </div>
          )}

          {phase === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground">Listo para empezar</h2>
                  <p className="text-sm text-muted-foreground font-sans">Revisa y crea tu cuenta.</p>
                </div>
              </div>
              <div className="rounded-2xl border border-border p-4 bg-surface-elevated">
                <div className="text-sm font-subtitle font-semibold">{f.name || "Tu nombre"}</div>
                <div className="text-xs text-muted-foreground font-sans">{f.email || "tu@email"}</div>
                <div className="mt-3 text-sm text-muted-foreground font-sans">{f.headline || "Título profesional"}</div>
                <div className="text-xs text-muted-foreground font-sans">{f.location || "Ubicación"}</div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {skills.slice(0, 6).map((s) => (
                    <span key={s} className="text-[11px] font-medium px-2 py-1 rounded-md bg-primary/15 font-sans">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {getValidationError() && (
            <div className="mt-6 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 font-sans">
              {getValidationError()}
            </div>
          )}

          <div className="mt-10 flex items-center justify-between">
            {phase > 0 ? (
              <Button variant="ghost" onClick={() => setPhase((p) => p - 1)} className="font-subtitle">
                <ArrowLeft className="h-4 w-4" /> Atrás
              </Button>
            ) : (
              <Link to="/register/elegir" className="text-sm text-muted-foreground hover:text-foreground font-sans">Cambiar rol</Link>
            )}

            {phase < PHASES.length - 1 ? (
              <Button
                onClick={() => setPhase((p) => p + 1)}
                disabled={!canNext()}
                className="bg-foreground text-background hover:bg-foreground/90 h-12 px-7 rounded-xl font-subtitle font-semibold"
              >
                Continuar <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                disabled={saving}
                className="bg-foreground text-background hover:bg-foreground/90 h-12 px-7 rounded-xl font-subtitle font-semibold"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear cuenta"}
              </Button>
            )}
          </div>

          <div className="mt-6 text-sm text-center text-muted-foreground font-sans">
            ¿Ya tienes cuenta? <Link to={`/login?role=${role}`} className="text-foreground font-subtitle font-semibold underline underline-offset-4">Inicia sesión</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterNew;
