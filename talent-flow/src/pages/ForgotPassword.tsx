import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { toast } from "sonner";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setIsSent(true);
      toast.success("Se han enviado las instrucciones a tu email");
    } catch {
      toast.error("Error al enviar el email. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSent) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <Link to="/" className="inline-block mb-8"><Logo size="md" /></Link>
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
          <h1 className="font-display text-2xl font-bold text-foreground mb-4">Email enviado</h1>
          <p className="text-muted-foreground mb-6">
            Si existe una cuenta con <strong>{email}</strong>, recibiras instrucciones para recuperar tu contraseña.
          </p>
          <Button asChild className="w-full h-12 rounded-xl font-subtitle font-semibold">
            <Link to="/login">Volver al login</Link>
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

        <h1 className="font-display text-3xl font-bold text-foreground mb-2">Recuperar contraseña</h1>
        <p className="text-muted-foreground mb-8">
          Ingresa tu email y te enviaremos instrucciones para restablecer tu contraseña.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-subtitle font-semibold uppercase tracking-wider">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="h-12 pl-10 rounded-xl"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !email}
            className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 rounded-xl font-subtitle font-semibold"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar instrucciones"}
          </Button>
        </form>

        <p className="mt-8 text-sm text-center text-muted-foreground">
          ¿Recordaste tu contraseña?{" "}
          <Link to="/login" className="text-foreground font-subtitle font-semibold underline underline-offset-4">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
