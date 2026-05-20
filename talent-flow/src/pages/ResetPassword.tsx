import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Loader2, Lock, ArrowLeft, CheckCircle } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { toast } from "sonner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (!token) {
      setError("Token invalido o expirado");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      setIsSuccess(true);
      toast.success("Contraseña actualizada correctamente");
      setTimeout(() => navigate("/login"), 2000);
    } catch {
      setError("Token invalido o expirado. Solicita un nuevo link.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <Link to="/" className="inline-block mb-8"><Logo size="md" /></Link>
          <h1 className="font-display text-2xl font-bold text-foreground mb-4">Link invalido</h1>
          <p className="text-muted-foreground mb-6">
            El link para restablecer tu contraseña es invalido o ha expirado.
          </p>
          <Button asChild className="w-full h-12 rounded-xl font-subtitle font-semibold">
            <Link to="/forgot-password">Solicitar nuevo link</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <Link to="/" className="inline-block mb-8"><Logo size="md" /></Link>
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
          <h1 className="font-display text-2xl font-bold text-foreground mb-4">Contraseña actualizada</h1>
          <p className="text-muted-foreground mb-6">
            Tu contraseña ha sido restablecida correctamente. Serás redirigido al login.
          </p>
          <Button asChild className="w-full h-12 rounded-xl font-subtitle font-semibold">
            <Link to="/login">Ir al login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-block mb-8"><Logo size="md" /></Link>

        <Link to="/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver al login
        </Link>

        <h1 className="font-display text-3xl font-bold text-foreground mb-2">Nueva contraseña</h1>
        <p className="text-muted-foreground mb-8">
          Ingresa tu nueva contraseña.
        </p>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-subtitle font-semibold uppercase tracking-wider">
              Nueva contraseña
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12 pl-10 rounded-xl"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-xs font-subtitle font-semibold uppercase tracking-wider">
              Confirmar contraseña
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12 pl-10 rounded-xl"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 rounded-xl font-subtitle font-semibold"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Restablecer contraseña"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
