import { useState } from "react";
import { useNavigate, useSearchParams, Navigate, Link } from "react-router-dom";
import { ArrowRight, Check, Sparkles, Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAuthStore, homeForRole, type UserRole } from "@/store/authStore";
import { userApi } from "@/lib/api";
import { toast } from "sonner";

type RoleKey = "candidato" | "empresa" | "freelancer" | "emprendedor" | "estudiante";

type SelectGroup = {
  label: string;
  options: string[];
};

const SKILLS_BY_ROLE: Record<RoleKey, string[]> = {
  candidato: ["React", "TypeScript", "Python", "Figma", "SQL", "Node.js", "Product Design", "Data Analysis", "Marketing", "Ventas", "UX Research", "Swift"],
  empresa: ["Reclutamiento", "RRHH", "Employer Branding", "ATS", "Entrevistas", "Onboarding", "Evaluación de talento"],
  freelancer: ["Diseño UI", "Branding", "Desarrollo web", "SEO", "Redacción", "Video", "Fotografía", "Ilustración", "Motion", "3D"],
  emprendedor: ["Product", "Growth", "Fundraising", "Ventas B2B", "Estrategia", "Liderazgo", "Marketing digital"],
  estudiante: ["React", "Python", "Java", "C++", "Análisis de datos", "Excel", "Figma", "Marketing", "Inglés", "Comunicación"],
};

const ROLE_STEPS: Record<RoleKey, string[]> = {
  candidato: ["Tu rol buscado", "Skills", "Preferencias"],
  empresa: ["Tu empresa", "Qué buscas", "Listo"],
  freelancer: ["Tu especialidad", "Skills", "Tarifas"],
  emprendedor: ["Tu proyecto", "Qué necesitas", "Listo"],
  estudiante: ["Tu carrera", "Skills", "Qué buscas"],
};

const CANDIDATE_HEADLINE_GROUPS: SelectGroup[] = [
  {
    label: "Diseño y Producto",
    options: ["Product Designer", "Senior Product Designer", "UX Designer", "UI Designer", "UX/UI Designer", "Product Manager"],
  },
  {
    label: "Desarrollo",
    options: ["Frontend Developer", "Backend Developer", "Full Stack Developer", "Mobile Developer", "QA Engineer", "DevOps Engineer"],
  },
  {
    label: "Datos y Negocio",
    options: ["Data Analyst", "Data Scientist", "Business Analyst", "Growth Specialist", "Marketing Specialist", "Sales Executive"],
  },
];

const CANDIDATE_LOCATION_GROUPS: SelectGroup[] = [
  {
    label: "Flexibilidad",
    options: ["Remote / Remoto", "Otra"],
  },
  {
    label: "Colombia",
    options: [
      "Bogotá, Colombia",
      "Medellín, Colombia",
      "Cali, Colombia",
      "Barranquilla, Colombia",
      "Cartagena, Colombia",
      "Bucaramanga, Colombia",
      "Pereira, Colombia",
      "Manizales, Colombia",
      "Santa Marta, Colombia",
      "Cúcuta, Colombia",
      "Ibagué, Colombia",
      "Villavicencio, Colombia",
      "Pasto, Colombia",
      "Montería, Colombia",
      "Armenia, Colombia",
    ],
  },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const role = params.get("role") as RoleKey | null;
  const { user, setUser, setOnboardingDone, isLoading } = useAuthStore();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});

  if (!user) return <Navigate to="/login" replace />;
  if (!role || !ROLE_STEPS[role]) return <Navigate to={homeForRole(user.role.toLowerCase() as UserRole)} replace />;

  const steps = ROLE_STEPS[role];
  const skills = SKILLS_BY_ROLE[role];

  const updateForm = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const toggleSkill = (s: string) =>
    setSelectedSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const handleFinish = async () => {
    setSaving(true);
    try {
      const updates: Record<string, unknown> = {};
      if (form.headline) updates.headline = form.headline;
      if (form.location) updates.location = form.location;
      if (form.bio) updates.bio = form.bio;

      const existingProfileData = user.profileData && typeof user.profileData === "object"
        ? (user.profileData as Record<string, unknown>)
        : {};

      const nextProfileData: Record<string, unknown> = {
        ...existingProfileData,
      };

      if (form.modality) nextProfileData.modalityPref = form.modality;
      if (form.salary) {
        const parsedSalary = Number(form.salary);
        if (Number.isFinite(parsedSalary)) {
          nextProfileData.expectedSalary = parsedSalary;
        }
      }

      if (Object.keys(nextProfileData).length > 0) {
        updates.profileData = nextProfileData;
      }

      if (Object.keys(updates).length > 0) {
        const { data } = await userApi.updateMe(updates);
        setUser(data);
      }

      if (selectedSkills.length > 0) {
        await userApi.addSkills(selectedSkills);
      }

      setOnboardingDone(true);
      toast.success("Perfil configurado. ¡Bienvenido a Joblify!");
      navigate(homeForRole(user.role.toLowerCase() as UserRole));
    } catch {
      toast.error("Error guardando perfil. Puedes completarlo desde Configuración.");
      setOnboardingDone(true);
      navigate(homeForRole(user.role.toLowerCase() as UserRole));
    } finally {
      setSaving(false);
    }
  };

  const isLastStep = step === steps.length - 1;

  const renderStep = () => {
    if (role === "candidato") {
      if (step === 0) return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Categoría / Título profesional</Label>
            <select
              value={form.headline || ""}
              onChange={e => updateForm("headline", e.target.value)}
              aria-label="Categoría o título profesional"
              title="Categoría o título profesional"
              className="w-full h-12 px-4 text-sm bg-surface-elevated border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 font-sans"
            >
              <option value="">Selecciona una opción</option>
              {CANDIDATE_HEADLINE_GROUPS.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.options.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Ubicación</Label>
            <select
              value={form.location || ""}
              onChange={e => updateForm("location", e.target.value)}
              aria-label="Ubicación"
              title="Ubicación"
              className="w-full h-12 px-4 text-sm bg-surface-elevated border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 font-sans"
            >
              <option value="">Selecciona ubicación</option>
              {CANDIDATE_LOCATION_GROUPS.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.options.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Modalidad preferida</Label>
            <div className="flex gap-3">
              {["Remoto", "Híbrido", "Presencial"].map(m => (
                <button key={m} type="button" onClick={() => updateForm("modality", m)}
                  className={cn("flex-1 h-12 rounded-xl border text-sm font-subtitle font-medium transition-all",
                    form.modality === m ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground")}>
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
      if (step === 1) return <SkillSelector skills={skills} selected={selectedSkills} onToggle={toggleSkill} />;
      if (step === 2) return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Bio profesional</Label>
            <textarea value={form.bio || ""} onChange={e => updateForm("bio", e.target.value)}
              placeholder="Cuéntanos brevemente sobre ti y tus objetivos profesionales..."
              className="w-full h-32 px-4 py-3 text-sm bg-surface-elevated border-transparent rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 font-sans" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Salario esperado (USD/mes)</Label>
            <Input value={form.salary || ""} onChange={e => updateForm("salary", e.target.value)}
              placeholder="3000" type="number" className="h-12 bg-surface-elevated border-transparent rounded-xl" />
          </div>
        </div>
      );
    }

    if (role === "empresa") {
      if (step === 0) return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Nombre de la empresa</Label>
            <Input value={form.company || ""} onChange={e => updateForm("company", e.target.value)}
              placeholder="Rappi, Nubank, tu empresa..." className="h-12 bg-surface-elevated border-transparent rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Industria</Label>
            <Input value={form.industry || ""} onChange={e => updateForm("industry", e.target.value)}
              placeholder="FinTech, eCommerce, SaaS..." className="h-12 bg-surface-elevated border-transparent rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Tamaño</Label>
            <div className="grid grid-cols-3 gap-2">
              {["1-10", "11-50", "51-200", "201-500", "500+"].map(s => (
                <button key={s} type="button" onClick={() => updateForm("size", s)}
                  className={cn("h-10 rounded-lg border text-xs font-subtitle font-medium transition-all",
                    form.size === s ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground")}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
      if (step === 1) return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground font-sans">¿Qué tipos de perfiles necesitas contratar principalmente?</p>
          <SkillSelector skills={skills} selected={selectedSkills} onToggle={toggleSkill} label="Tipos de talento que buscas" />
        </div>
      );
    }

    if (role === "freelancer") {
      if (step === 0) return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Especialidad principal</Label>
            <Input value={form.headline || ""} onChange={e => updateForm("headline", e.target.value)}
              placeholder="Brand Designer, Full Stack Dev..." className="h-12 bg-surface-elevated border-transparent rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Años de experiencia</Label>
            <div className="flex gap-3">
              {["< 1", "1-3", "3-5", "5-10", "10+"].map(y => (
                <button key={y} type="button" onClick={() => updateForm("years", y)}
                  className={cn("flex-1 h-11 rounded-xl border text-sm font-subtitle font-medium transition-all",
                    form.years === y ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground")}>
                  {y}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
      if (step === 1) return <SkillSelector skills={skills} selected={selectedSkills} onToggle={toggleSkill} />;
      if (step === 2) return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Tarifa por hora (USD)</Label>
            <Input value={form.rate || ""} onChange={e => updateForm("rate", e.target.value)}
              placeholder="25" type="number" className="h-12 bg-surface-elevated border-transparent rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Disponibilidad</Label>
            <div className="flex gap-3">
              {["Tiempo completo", "Medio tiempo", "Por proyecto"].map(d => (
                <button key={d} type="button" onClick={() => updateForm("availability", d)}
                  className={cn("flex-1 h-11 rounded-xl border text-xs font-subtitle font-medium transition-all",
                    form.availability === d ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground")}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (role === "emprendedor") {
      if (step === 0) return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Nombre de tu proyecto/startup</Label>
            <Input value={form.project || ""} onChange={e => updateForm("project", e.target.value)}
              placeholder="HealthOS, FinanceAI..." className="h-12 bg-surface-elevated border-transparent rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Etapa actual</Label>
            <div className="grid grid-cols-2 gap-2">
              {["Idea", "MVP", "Seed", "Serie A"].map(s => (
                <button key={s} type="button" onClick={() => updateForm("stage", s)}
                  className={cn("h-11 rounded-xl border text-sm font-subtitle font-medium transition-all",
                    form.stage === s ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground")}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
      if (step === 1) return <SkillSelector skills={skills} selected={selectedSkills} onToggle={toggleSkill} label="Habilidades que buscas en tu equipo" />;
    }

    if (role === "estudiante") {
      if (step === 0) return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Carrera / Programa</Label>
            <Input value={form.career || ""} onChange={e => updateForm("career", e.target.value)}
              placeholder="Ingeniería de Sistemas, Diseño..." className="h-12 bg-surface-elevated border-transparent rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Universidad</Label>
            <Input value={form.institution || ""} onChange={e => updateForm("institution", e.target.value)}
              placeholder="UNAM, Uniandes, ITESM..." className="h-12 bg-surface-elevated border-transparent rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Semestre / Año</Label>
            <Input value={form.semester || ""} onChange={e => updateForm("semester", e.target.value)}
              placeholder="7" type="number" className="h-12 bg-surface-elevated border-transparent rounded-xl" />
          </div>
        </div>
      );
      if (step === 1) return <SkillSelector skills={skills} selected={selectedSkills} onToggle={toggleSkill} />;
      if (step === 2) return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground font-sans">¿Qué tipo de oportunidad buscas?</p>
          <div className="grid grid-cols-2 gap-3">
            {["Práctica profesional", "Trabajo part-time", "Mentoría", "Beca"].map(t => (
              <button key={t} type="button" onClick={() => updateForm("seeking", t)}
                className={cn("h-14 rounded-xl border text-sm font-subtitle font-medium transition-all px-3",
                  form.seeking === t ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground")}>
                {t}
              </button>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  const stepTitles: Record<RoleKey, string[]> = {
    candidato: ["¿Qué tipo de trabajo buscas?", "¿Cuáles son tus skills?", "Últimos detalles"],
    empresa: ["Cuéntanos sobre tu empresa", "¿Qué talento necesitas?", "Todo listo"],
    freelancer: ["Tu especialidad", "Tus skills", "Tus tarifas"],
    emprendedor: ["Tu proyecto", "¿Qué equipo necesitas?", "Todo listo"],
    estudiante: ["Tu carrera", "Tus skills", "¿Qué buscas?"],
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="h-16 border-b border-border flex items-center px-6 lg:px-10">
        <Logo size="md" />
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-sans">Paso {step + 1} de {steps.length}</span>
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground font-sans">← Volver al login</Link>
          <button onClick={() => { setOnboardingDone(true); navigate(homeForRole(user.role.toLowerCase() as UserRole)); }}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 font-sans">
            Saltar por ahora
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          <div className="flex gap-2 mb-10">
            {steps.map((_, i) => (
              <div key={i} className={cn("h-1.5 flex-1 rounded-full transition-all",
                i <= step ? "bg-primary" : "bg-surface-elevated")} />
            ))}
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs font-subtitle font-semibold uppercase tracking-wider text-primary">
              {steps[step]}
            </span>
          </div>

          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            {stepTitles[role][step]}
          </h1>
          <p className="text-sm text-muted-foreground font-sans mb-8">
            Esto nos ayuda a personalizar tu experiencia con IA.
          </p>

          {renderStep()}

          <div className="mt-10 flex justify-between">
            {step > 0 ? (
              <Button variant="ghost" onClick={() => setStep(s => s - 1)} className="font-subtitle">Atrás</Button>
            ) : <div />}

            {isLastStep ? (
              <Button onClick={handleFinish} disabled={saving || isLoading} size="lg"
                className="bg-foreground text-background hover:bg-foreground/90 h-12 px-8 rounded-xl font-subtitle font-semibold">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4" /> Empezar</>}
              </Button>
            ) : (
              <Button onClick={() => setStep(s => s + 1)} size="lg"
                className="bg-foreground text-background hover:bg-foreground/90 h-12 px-8 rounded-xl font-subtitle font-semibold">
                Continuar <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SkillSelector = ({ skills, selected, onToggle, label = "Selecciona tus skills" }: {
  skills: string[];
  selected: string[];
  onToggle: (s: string) => void;
  label?: string;
}) => (
  <div className="space-y-3">
    <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">{label}</Label>
    <div className="flex flex-wrap gap-2">
      {skills.map(s => (
        <button key={s} type="button" onClick={() => onToggle(s)}
          className={cn("px-3 py-2 rounded-full text-sm font-sans transition-all border",
            selected.includes(s)
              ? "bg-foreground text-background border-foreground"
              : "border-border hover:border-foreground text-foreground")}>
          {s}
        </button>
      ))}
    </div>
    {selected.length > 0 && (
      <p className="text-xs text-muted-foreground font-sans">{selected.length} seleccionados</p>
    )}
  </div>
);

export default Onboarding;
