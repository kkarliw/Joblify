import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type LoginRequiredDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  loginTo?: string;
};

export const LoginRequiredDialog = ({
  open,
  onOpenChange,
  title = "Inicia sesión para continuar",
  description = "Esta acción requiere una cuenta activa de Joblify.",
  loginTo = "/login",
}: LoginRequiredDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{title}</DialogTitle>
          <DialogDescription className="font-sans text-sm">{description}</DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button asChild variant="outline" className="rounded-xl font-subtitle">
            <Link to="/register/elegir" onClick={() => onOpenChange(false)}>
              Crear cuenta
            </Link>
          </Button>
          <Button asChild className="rounded-xl bg-foreground text-background hover:bg-foreground/90 font-subtitle font-semibold">
            <Link to={loginTo} onClick={() => onOpenChange(false)}>
              Iniciar sesión
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
