import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import heroPerson from "@/assets/hero-person.png";
import { useAuthStore } from "@/store/authStore";
import { authApi, API_URL } from "@/lib/api";
import "./LoginClean.css";

// Nota: El endpoint de perfil es /api/users/me (no /api/profile/me)

const LoginClean = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    // Validaciones
    if (!email.trim()) {
      setLocalError("El email es requerido");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLocalError("Email inválido");
      return;
    }
    if (!password) {
      setLocalError("La contraseña es requerida");
      return;
    }
    if (password.length < 8) {
      setLocalError("La contraseña debe tener mínimo 8 caracteres");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data } = await authApi.login({ email: email.trim(), password });

      const normalizedUser = { ...data.user, role: data.user.role.toLowerCase() };
      
      localStorage.setItem("joblify.token", data.accessToken);
      localStorage.setItem("joblify.refresh", data.refreshToken);

      // Verificar si el perfil está completo (onboarding ya hecho)
      const hasCompletedProfile = normalizedUser.headline || normalizedUser.bio || (normalizedUser.profileCompletion && normalizedUser.profileCompletion > 30);

      useAuthStore.setState({
        user: normalizedUser,
        token: data.accessToken,
        refreshToken: data.refreshToken,
        onboardingDone: hasCompletedProfile,
      });

      const next = searchParams.get("next");
      const safeNext = next && next.startsWith("/") ? next : null;

      toast.success("Bienvenido de vuelta");
      
      // Solo redirigir a onboarding si NO ha completado el perfil
      if (safeNext) {
        navigate(safeNext, { replace: true });
      } else if (hasCompletedProfile) {
        const { homeForRole } = await import("@/store/authStore");
        navigate(homeForRole(normalizedUser.role), { replace: true });
      } else {
        navigate(`/onboarding?role=${encodeURIComponent(normalizedUser.role)}`, { replace: true });
      }
    } catch (err: unknown) {
      const errorData = (err as { response?: { data?: { needsVerification?: boolean; email?: string; error?: string } } })
        ?.response
        ?.data;

      if (errorData?.needsVerification && errorData.email) {
        navigate(`/register?step=verify&email=${encodeURIComponent(errorData.email)}`, { replace: true });
        toast.error(errorData.error || "Debes verificar tu email");
        setIsSubmitting(false);
        return;
      }

      const message = errorData?.error || (err instanceof Error ? err.message : "Error desconocido");
      setLocalError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr] bg-background">
      <div className="hidden lg:flex relative overflow-hidden bg-white border-r border-border">
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="yellow-rect yellow-rect-1" />
          <div className="yellow-rect yellow-rect-2" />
          <div className="yellow-rect yellow-rect-3" />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-8 xl:p-12 w-full">
          <Link to="/"><Logo size="lg" variant="dark" /></Link>
          <div className="max-w-sm">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-foreground text-background text-[11px] font-subtitle font-semibold uppercase tracking-wider">
              Login Joblify
            </span>
            <p className="mt-4 font-display text-2xl xl:text-3xl font-bold text-foreground leading-tight">
              Tu espacio profesional te espera
            </p>
            <p className="mt-3 text-sm text-muted-foreground font-sans">
              Accede con tu email y contraseña. Te llevaremos a tu dashboard personalizado.
            </p>
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

          <h1 className="font-display text-4xl font-bold text-foreground">Bienvenido de vuelta</h1>
          <p className="mt-3 text-sm text-muted-foreground font-sans">Ingresa a tu cuenta de Joblify</p>

          {localError && (
            <div
              data-testid="login-error-banner"
              className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 font-sans"
            >
              {localError}
            </div>
          )}

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-subtitle font-semibold uppercase tracking-wider">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="tu@email.com" 
                className="h-12 bg-surface-elevated border-transparent rounded-xl" 
                required 
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-subtitle font-semibold uppercase tracking-wider">Contraseña</Label>
                <Link to="/forgot-password" className="text-xs underline underline-offset-2 text-muted-foreground hover:text-foreground font-sans">¿Olvidaste?</Link>
              </div>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="••••••••" 
                className="h-12 bg-surface-elevated border-transparent rounded-xl" 
                required 
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 rounded-xl font-subtitle font-semibold">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Iniciar sesión"}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">O continúa con</span>
              </div>
            </div>

            <Button
              variant="outline"
              type="button"
              onClick={() => window.location.href = `${API_URL}/auth/google`}
              className="w-full h-12 mt-4 rounded-xl font-subtitle font-semibold border-2"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </Button>
          </div>

          <p className="mt-8 text-sm text-center text-muted-foreground font-sans">
            ¿Aún no tienes cuenta? <Link to="/register/elegir" className="text-foreground font-subtitle font-semibold underline underline-offset-4">Regístrate</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginClean;
