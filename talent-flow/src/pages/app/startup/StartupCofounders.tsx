import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { Search, MapPin, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { userApi } from "@/lib/api";

type CofounderUser = {
  id: string;
  name: string;
  headline?: string | null;
  location?: string | null;
  avatarUrl?: string | null;
  role?: string;
  isVerified?: boolean;
};

const COFOUNDER_ALLOWED_ROLES = new Set(["FREELANCER", "CANDIDATE", "STUDENT", "MENTOR"]);

const normalizeRole = (value?: string | null) => String(value || "").trim().toUpperCase();

const StartupCofounders = () => {
  const [q, setQ] = useState("");

  const { data: users = [], isLoading } = useQuery<CofounderUser[]>({
    queryKey: ["users", "cofounders", q],
    queryFn: async () => {
      const res = await userApi.search(q.trim(), undefined, 1, 30);
      const data = (res.data?.data || []) as CofounderUser[];
      return data.filter((user) => {
        const role = normalizeRole(user.role);
        return COFOUNDER_ALLOWED_ROLES.has(role);
      });
    },
  });

  return (
    <div>
      <PageHeader eyebrow="Encuentra equipo" title="Cofundadores disponibles" subtitle="Personas verificadas que buscan sumarse a proyectos como el tuyo." />
      <div className="flex items-center gap-2 bg-card border border-border rounded-xl p-2 mb-5">
        <Search className="h-4 w-4 text-muted-foreground ml-2" />
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por habilidad, rol o ciudad" className="border-0 shadow-none focus-visible:ring-0" />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {isLoading && (
          <article className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
            Cargando perfiles...
          </article>
        )}

        {!isLoading && users.length === 0 && (
          <article className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
            No encontramos perfiles con esta búsqueda.
          </article>
        )}

        {!isLoading && users.map((user) => (
          <article key={user.id} className="rounded-2xl border border-border bg-card p-5">
            <header className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-semibold overflow-hidden">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name.split(" ").map(n => n[0]).slice(0, 2).join("")
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-subtitle font-semibold truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground font-sans truncate">
                  {user.headline || "Profesional disponible"} · <MapPin className="inline h-3 w-3" /> {user.location || "Remoto"}
                </p>
              </div>
            </header>
            <p className="mt-3 text-sm font-sans text-foreground line-clamp-2">
              {user.headline || "Explora este perfil para invitarle a colaborar en tus startups."}
            </p>
            <div className="mt-4 flex gap-2">
              <Link to="/app/startup/mensajes" className="flex-1 h-9 rounded-lg bg-foreground text-background text-xs font-subtitle font-semibold hover:bg-foreground/90 inline-flex items-center justify-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Invitar al proyecto
              </Link>
              <Link to={`/app/startup/perfil/${user.id}`} className="h-9 px-3 rounded-lg border border-border text-xs font-subtitle font-semibold hover:bg-surface-elevated inline-flex items-center">
                Ver perfil
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default StartupCofounders;
