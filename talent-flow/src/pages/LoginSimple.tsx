import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Briefcase, Building2, Sparkles, Rocket, GraduationCap, Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
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

const roles: { id: RoleKey; label: string; Icon: typeof Briefcase }[] = [
  { id: "candidato", label: "Talento", Icon: Briefcase },
  { id: "empresa", label: "Empresa", Icon: Building2 },
  { id: "freelancer", label: "Freelancer", Icon: Sparkles },
  { id: "emprendedor", label: "Emprendedor", Icon: Rocket },
  { id: "estudiante", label: "Estudiante", Icon: GraduationCap },
];

const LoginSimple = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const preset = (params.get("role") as RoleKey | null) || "candidato";
  const { login, isLoading, error, clearError, user, onboardingDone } = useAuthStore();
  const [role, setRole] = useState<RoleKey>(preset);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (user) return <Navigate to={onboardingDone ? homeForRole(user.role) : `/onboarding?role=${role}`} replace />;

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
    <div className="min-h-screen bg-white flex flex-col">
      <header className="h-16 border-b border-border flex items-center px-6 lg:px-10">
        <Link to="/" aria-label="Inicio"><Logo size="md" variant="dark" /></Link>
        <Link to="/register/elegir" className="ml-auto text-sm text-muted-foreground hover:text-foreground font-sans">¿No tienes cuenta? <span className="underline font-subtitle font-semibold">Regístrate</span></Link>
      </header>

      <main className="flex-1 grid md:grid-cols-[1.1fr_1fr]">
        <div className="hidden md:flex flex-col justify-center px-12 border-r border-border bg-white">
          <p className="text-sm font-subtitle font-semibold text-primary uppercase tracking-wider">Login Joblify</p>
          <h1 className="mt-4 font-display text-4xl font-bold text-foreground leading-tight">Entra y continúa donde lo dejaste.</h1>
          <p className="mt-3 text-sm text-muted-foreground font-sans max-w-xl">Usa tu correo y contraseña. El rol solo define a qué dashboard llegas.</p>
        </div>

        <div className="flex items-center justify-center p-6 lg:p-10">
          <div className="w-full max-w-md">
            <div className="mb-6">
              <p className="text-xs font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Rol</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={cn(
                      "h-10 px-3 rounded-full border text-sm font-subtitle font-semibold flex items-center gap-2 transition-all",
                      role === r.id ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground"
                    )}
                  >
                    <r.Icon className="h-4 w-4" /> {r.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 font-sans">{error}</div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" className="h-12 bg-surface-elevated border-transparent rounded-xl" required />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-subtitle font-semibold uppercase tracking-wider">Contraseña</Label>
                  <Link to="/reset-password" className="text-xs underline underline-offset-2 text-muted-foreground hover:text-foreground font-sans">¿Olvidaste?</Link>
                </div>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-12 bg-surface-elevated border-transparent rounded-xl" required />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 rounded-xl font-subtitle font-semibold">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Iniciar sesión"}
              </Button>
            </form>

            <p className="mt-6 text-sm text-center text-muted-foreground font-sans">
              ¿Aún no tienes cuenta? <Link to={`/register?role=${role}`} className="text-foreground font-subtitle font-semibold underline underline-offset-4">Regístrate</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginSimple;
