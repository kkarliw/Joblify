export { default } from "./RegisterClean";

const steps = ["Datos básicos", "Tu perfil"];

type RoleKey = "candidato" | "empresa" | "freelancer" | "emprendedor" | "estudiante";

const roleLabels: Record<RoleKey, string> = {
  candidato: "Talento",
  empresa: "Empresa",
  freelancer: "Freelancer",
  emprendedor: "Emprendedor",
  estudiante: "Estudiante",
};

const roleToBackend: Record<RoleKey, string> = {
  candidato: "candidato",
  empresa: "empresa",
  freelancer: "freelancer",
  emprendedor: "emprendedor",
  estudiante: "estudiante",
};

const Register = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const role = params.get("role") as RoleKey | null;
  const [step, setStep] = useState(0);
  const { register, isLoading, error, clearError, user } = useAuthStore();

  const [form, setForm] = useState({
    nombre: "", apellido: "", email: "", password: "",
    headline: "", location: "", skills: "",
  });

  if (!role || !roleLabels[role]) return <Navigate to="/register/elegir" replace />;
  if (user) return <Navigate to={`/onboarding?role=${role}`} replace />;

  const roleInfo = userTypes.find(u => u.id === role);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async () => {
    clearError();
    if (!form.nombre || !form.email || !form.password) {
      toast.error("Nombre, email y contraseña son obligatorios");
      return;
    }
    try {
      await register({
        email: form.email,
        password: form.password,
        name: `${form.nombre} ${form.apellido}`.trim(),
        role: roleToBackend[role],
        headline: form.headline || undefined,
        location: form.location || undefined,
      });
      toast.success("Cuenta creada. Completa tu perfil.");
      navigate(`/onboarding?role=${role}`);
    } catch (err: unknown) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_1.1fr] bg-white">
      <div className="hidden lg:flex relative overflow-hidden bg-white border-r border-border">
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="yellow-rect absolute" style={{ width: 280, height: 700, left: 30, top: 30 }} />
          <div className="yellow-rect absolute" style={{ width: 240, height: 620, left: 220, top: 200, opacity: 0.55 }} />
          <div className="yellow-rect absolute" style={{ width: 170, height: 380, left: 380, top: 60, opacity: 0.5 }} />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-8 xl:p-12 w-full">
          <Link to="/"><Logo size="lg" variant="dark" /></Link>
          <div className="max-w-sm">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-foreground text-background text-[11px] font-subtitle font-semibold uppercase tracking-wider">
              {roleLabels[role]}
            </span>
            <h2 className="mt-4 font-display text-3xl xl:text-4xl font-bold leading-tight text-foreground">
              {roleInfo?.title} en Joblify, <span className="text-primary">a tu manera</span>.
            </h2>
            <p className="mt-4 text-sm text-muted-foreground font-sans">{roleInfo?.description}</p>
          </div>
          <div className="flex items-end justify-center min-h-0 overflow-hidden">
            <img src={heroPerson} alt="" aria-hidden className="max-h-[32vh] xl:max-h-[40vh] w-auto object-contain object-bottom" />
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        <header className="h-20 border-b border-border flex items-center px-6 lg:px-10 gap-4">
          <Link to="/" className="lg:hidden"><Logo size="md" /></Link>
          <Link to="/register/elegir" className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 font-sans">Cambiar rol</Link>
          <Link to={`/login?role=${role}`} className="ml-auto text-sm text-muted-foreground hover:text-foreground font-sans">
            ¿Ya tienes cuenta? <span className="text-foreground font-subtitle font-semibold underline underline-offset-4">Inicia sesión</span>
          </Link>
        </header>

        <div className="flex-1 max-w-xl w-full mx-auto px-6 py-10 lg:py-14">
          <div className="mb-6 lg:hidden">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-elevated text-[11px] font-subtitle font-semibold uppercase tracking-wider text-foreground">
              Registrándote como {roleLabels[role]}
            </span>
          </div>

          <div className="flex items-center gap-3 mb-10">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-3 flex-1">
                <div className={cn(
                  "h-8 w-8 rounded-full border flex items-center justify-center text-xs font-subtitle font-semibold shrink-0",
                  i < step && "bg-foreground text-background border-foreground",
                  i === step && "bg-primary text-primary-foreground border-primary",
                  i > step && "border-border text-muted-foreground"
                )}>
                  {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span className={cn("text-xs font-subtitle font-medium hidden md:inline", i === step ? "text-foreground" : "text-muted-foreground")}>{s}</span>
                {i < steps.length - 1 && <div className="flex-1 h-px bg-border" />}
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 font-sans">{error}</div>
          )}

          {step === 0 && (
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Cuéntanos sobre ti.</h1>
              <p className="mt-3 text-muted-foreground font-sans">Datos básicos para crear tu cuenta de {roleLabels[role]}.</p>
              <div className="mt-8 grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Nombre</Label>
                  <Input value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Camila" className="h-12 bg-surface-elevated border-transparent rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Apellido</Label>
                  <Input value={form.apellido} onChange={e => set("apellido", e.target.value)} placeholder="Rodríguez" className="h-12 bg-surface-elevated border-transparent rounded-xl" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Email</Label>
                  <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="tu@email.com" className="h-12 bg-surface-elevated border-transparent rounded-xl" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Contraseña</Label>
                  <Input type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="Mínimo 8 caracteres" className="h-12 bg-surface-elevated border-transparent rounded-xl" />
                </div>
              </div>
              <div className="mt-10 flex justify-between">
                <Button variant="ghost" asChild className="font-subtitle"><Link to="/register/elegir">Atrás</Link></Button>
                <Button onClick={() => setStep(1)} size="lg" className="bg-foreground text-background hover:bg-foreground/90 h-12 px-7 rounded-xl font-subtitle font-semibold">
                  Continuar <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Construye tu perfil.</h1>
              <p className="mt-3 text-muted-foreground font-sans">Cuéntanos qué haces. Podrás ampliarlo después.</p>
              <div className="mt-8 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Título profesional</Label>
                  <Input value={form.headline} onChange={e => set("headline", e.target.value)} placeholder="Senior Product Designer" className="h-12 bg-surface-elevated border-transparent rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Ubicación</Label>
                  <Input value={form.location} onChange={e => set("location", e.target.value)} placeholder="Ciudad de México" className="h-12 bg-surface-elevated border-transparent rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Skills principales</Label>
                  <Input value={form.skills} onChange={e => set("skills", e.target.value)} placeholder="Figma, Research, Design Systems" className="h-12 bg-surface-elevated border-transparent rounded-xl" />
                </div>
              </div>
              <div className="mt-10 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(0)} className="font-subtitle">Atrás</Button>
                <Button onClick={handleCreate} disabled={isLoading} size="lg" className="bg-foreground text-background hover:bg-foreground/90 h-12 px-7 rounded-xl font-subtitle font-semibold">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Crear cuenta</span><ArrowRight className="h-4 w-4" /></>}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
