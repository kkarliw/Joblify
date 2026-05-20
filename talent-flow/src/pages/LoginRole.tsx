import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Briefcase, Building2, Sparkles, Rocket, GraduationCap, Loader2, Lock, Mail } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import heroPerson from "@/assets/hero-person.png";
import { useAuthStore, homeForRole, type UserRole } from "@/store/authStore";
import { toast } from "sonner";

type RoleKey = "candidato" | "empresa" | "freelancer" | "emprendedor" | "estudiante";

const roleToBackend: Record<RoleKey, UserRole> = {
  candidato: "candidato",
  empresa: "empresa",
  freelancer: "freelancer",
  emprendedor: "emprendedor",
  estudiante: "estudiante",
};

const roleMeta: Record<RoleKey, { label: string; tagline: string; Icon: typeof Briefcase; heading: string; sub: string; demo: string }> = {
  candidato: { label: "Talento", tagline: "Tu próximo empleo te espera", Icon: Briefcase, heading: "Bienvenido", sub: "Ingresa para explorar vacantes con match IA.", demo: "candidato_demo@joblify.com" },
  empresa: { label: "Empresa", tagline: "Pipeline y candidatos rankeados", Icon: Building2, heading: "Bienvenido", sub: "Accede a tu dashboard de reclutamiento.", demo: "company_demo@joblify.com" },
  freelancer: { label: "Freelancer", tagline: "Tus proyectos y pagos protegidos", Icon: Sparkles, heading: "Bienvenido", sub: "Gestiona tus servicios y clientes.", demo: "freelancer_demo@joblify.com" },
  emprendedor: { label: "Emprendedor", tagline: "Construye tu equipo fundador", Icon: Rocket, heading: "Bienvenido", sub: "Gestiona tus startups y postulantes a co-founder.", demo: "entrepreneur_demo@joblify.com" },
  estudiante: { label: "Estudiante", tagline: "Prácticas, mentores y recursos", Icon: GraduationCap, heading: "Hola", sub: "Encuentra tu próxima práctica y aprende de mentores.", demo: "student_demo@joblify.com" },
};

const LoginRole = () => {
  const { role } = useParams<{ role: RoleKey }>();
  const navigate = useNavigate();
  const { login, isLoading, error, clearError, user, onboardingDone } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => { clearError(); }, [role, clearError]);

  if (!role || !roleMeta[role]) return <Navigate to="/login/elegir" replace />;
  if (user) return <Navigate to={onboardingDone ? homeForRole(user.role) : `/onboarding?role=${role}`} replace />;

  const meta = roleMeta[role];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(email, password);
      const { user: u, onboardingDone: od } = useAuthStore.getState();
      toast.success("Sesión iniciada");
      navigate(od ? homeForRole(u!.role) : `/onboarding?role=${role}`);
    } catch (err: unknown) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr] bg-background">
      <div className="hidden lg:flex relative overflow-hidden bg-white border-r border-border">
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="yellow-rect absolute" style={{ width: 280, height: 720, left: 40, top: 30 }} />
          <div className="yellow-rect absolute" style={{ width: 240, height: 640, left: 240, top: 200, opacity: 0.55 }} />
          <div className="yellow-rect absolute" style={{ width: 170, height: 380, left: 400, top: 60, opacity: 0.5 }} />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-8 xl:p-12 w-full">
          <Link to="/"><Logo size="lg" variant="dark" /></Link>
          <div className="max-w-sm">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-foreground text-background text-[11px] font-subtitle font-semibold uppercase tracking-wider">
              <meta.Icon className="h-3 w-3" /> {meta.label}
            </span>
            <p className="mt-4 font-display text-2xl xl:text-3xl font-bold text-foreground leading-tight">{meta.tagline}</p>
          </div>
          <div className="flex-1 flex items-end justify-center min-h-0 overflow-hidden">
            <img src={heroPerson} alt="" aria-hidden className="max-h-[45vh] xl:max-h-[55vh] w-auto object-contain object-bottom" />
          </div>
          <div className="text-xs text-muted-foreground font-sans">© {new Date().getFullYear()} Joblify · Hecho en LATAM</div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-10 bg-white">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden inline-block mb-8"><Logo size="md" /></Link>

          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-elevated text-[11px] font-subtitle font-semibold uppercase tracking-wider text-foreground">
              <meta.Icon className="h-3 w-3" /> {meta.label}
            </span>
            <Link to="/login/elegir" className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 font-sans">Cambiar rol</Link>
          </div>

          <h1 className="font-display text-4xl font-bold text-foreground">{meta.heading}</h1>
          <p className="mt-3 text-sm text-muted-foreground font-sans">{meta.sub}</p>

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 font-sans">{error}</div>
          )}

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-subtitle font-semibold uppercase tracking-wider">Email</Label>
              <div className="relative">
                <Mail className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" className="h-12 pl-10 bg-surface-elevated border-transparent rounded-xl" required />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-subtitle font-semibold uppercase tracking-wider">Contraseña</Label>
                <Link to="/reset-password" className="text-xs underline underline-offset-2 text-muted-foreground hover:text-foreground font-sans">¿Olvidaste?</Link>
              </div>
              <div className="relative">
                <Lock className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-12 pl-10 bg-surface-elevated border-transparent rounded-xl" required />
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 rounded-xl font-subtitle font-semibold">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Entrar como ${meta.label}`}
            </Button>

          </form>

          <p className="mt-8 text-sm text-center text-muted-foreground font-sans">
            ¿Aún no tienes cuenta? <Link to={`/register?role=${role}`} className="text-foreground font-subtitle font-semibold underline underline-offset-4">Regístrate</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginRole;
