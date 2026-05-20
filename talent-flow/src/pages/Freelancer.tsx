import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Star, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout as AppLayout } from "@/components/Layouts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { userApi } from "@/lib/api";
import { LoginRequiredDialog } from "@/components/LoginRequiredDialog";
import { homeForRole, useAuthStore } from "@/store/authStore";
import { hasRealSession } from "@/lib/session";

type UserSearchItem = {
  id: string;
  name: string;
  role?: string | null;
  headline?: string | null;
  location?: string | null;
  avatarUrl?: string | null;
  profileCompletion?: number | null;
};

const getUsersFromResponse = (payload: unknown): UserSearchItem[] => {
  if (Array.isArray(payload)) return payload as UserSearchItem[];
  if (payload && typeof payload === "object") {
    const obj = payload as { data?: unknown; users?: unknown };
    if (Array.isArray(obj.data)) return obj.data as UserSearchItem[];
    if (Array.isArray(obj.users)) return obj.users as UserSearchItem[];
  }
  return [];
};

const Freelancer = () => {
  const navigate = useNavigate();
  const { user, token, refreshToken } = useAuthStore();
  const [q, setQ] = useState("");
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [loginTarget, setLoginTarget] = useState("/login");

  const isAuthenticated = hasRealSession(user, token, refreshToken);
  const appBase = user?.role ? homeForRole(user.role) : "/app/talento";

  const handleProtectedAction = (targetPath: string) => {
    if (isAuthenticated) {
      navigate(targetPath);
      return;
    }

    setLoginTarget(`/login?next=${encodeURIComponent(targetPath)}`);
    setAuthDialogOpen(true);
  };

  const { data: users = [], isLoading, isFetching, isError, refetch } = useQuery<UserSearchItem[]>({
    queryKey: ["users", "freelancers", q],
    queryFn: async () => {
      const response = await userApi.searchPublic(q.trim(), "freelancer", 1, 24);
      return getUsersFromResponse(response.data);
    },
  });

  const freelancers = useMemo(() => {
    const filtered = users.filter((user) => user.role?.toLowerCase() === "freelancer");
    return filtered.length > 0 ? filtered : users;
  }, [users]);

  return (
    <AppLayout>
      <section className="max-w-[1200px] mx-auto px-6 lg:px-10 py-10 lg:py-12">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Freelancers</h1>
          <p className="mt-2 text-muted-foreground font-sans">
            Profesionales independientes con perfil visible y datos reales de Joblify.
          </p>

          <div className="mt-8 bg-white border border-border rounded-2xl p-2 flex flex-col sm:flex-row gap-2 shadow-[0_8px_30px_-16px_rgba(37,50,75,0.12)]">
            <div className="flex-1 flex items-center gap-2 px-3">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                placeholder="Nombre, skill o rol"
                value={q}
                onChange={(event) => setQ(event.target.value)}
                className="border-0 shadow-none focus-visible:ring-0 h-11 px-0 font-sans text-sm"
              />
            </div>
            <Button
              onClick={() => refetch()}
              className="h-11 px-6 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-subtitle font-semibold"
            >
              Buscar
            </Button>
          </div>
        </div>

        <div className="mt-8 lg:mt-10">
          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground mb-5 font-sans">
            <span className="shrink-0">{freelancers.length} resultados</span>
            {(isLoading || isFetching) && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>

          {isError ? (
            <div className="rounded-2xl border border-border bg-white p-6 text-sm text-muted-foreground">
              No pudimos cargar freelancers ahora. Intenta de nuevo en unos segundos.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {freelancers.map((freelancer) => {
                const initials = freelancer.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <article key={freelancer.id} className="rounded-2xl border border-border bg-white p-6 flex flex-col">
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-semibold overflow-hidden">
                        {freelancer.avatarUrl ? (
                          <img src={freelancer.avatarUrl} alt={freelancer.name} className="w-full h-full object-cover" />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="font-subtitle font-semibold text-base truncate">{freelancer.name}</h2>
                        <p className="text-sm text-muted-foreground font-sans truncate">
                          {freelancer.headline || "Freelancer en Joblify"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground font-sans">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{freelancer.location || "Remoto"}</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 text-primary" />Perfil verificado</span>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border flex gap-2">
                      <Button
                        className="flex-1 h-10 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-subtitle font-semibold"
                        onClick={() => handleProtectedAction(`${appBase}/perfil/${freelancer.id}`)}
                      >
                        Ver perfil
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 h-10 rounded-xl font-subtitle"
                        onClick={() => handleProtectedAction(`${appBase}/mensajes`)}
                      >
                        Contactar
                      </Button>
                    </div>
                  </article>
                );
              })}

              {!isLoading && freelancers.length === 0 && (
                <div className="md:col-span-2 xl:col-span-3 rounded-2xl border border-border bg-white p-8 text-center">
                  <h3 className="font-subtitle font-semibold text-foreground">No encontramos freelancers con esa búsqueda</h3>
                  <p className="text-sm text-muted-foreground mt-2">Intenta con otro nombre, skill o palabra clave.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <LoginRequiredDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        description="Para ver perfiles completos y enviar mensajes, necesitas iniciar sesión."
        loginTo={loginTarget}
      />
    </AppLayout>
  );
};

export default Freelancer;
