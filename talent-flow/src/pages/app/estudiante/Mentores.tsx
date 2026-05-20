import { PageHeader } from "@/components/PageHeader";
import { Star, Calendar, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { userApi } from "@/lib/api";
import { useNavigate } from "react-router-dom";

type MentorItem = {
  id: string;
  name: string;
  role: string;
  area: string;
  rating: number;
  sessions: number;
  slots: string;
  avatarUrl?: string;
};

const Mentores = () => {
  const navigate = useNavigate();

  const { data: mentors = [], isLoading } = useQuery<MentorItem[]>({
    queryKey: ["estudiante", "mentores", "list"],
    queryFn: async () => {
      const response = await userApi.search("", "mentor", 1, 24);
      const payload = response.data as { data?: Array<Record<string, unknown>> };
      const users = Array.isArray(payload?.data) ? payload.data : [];

      return users
        .map((item) => {
          const name = String(item.name || "Mentor");
          const headline = String(item.headline || "Mentor profesional");
          const profileData = (item.profileData || {}) as Record<string, unknown>;
          const specialty = String(profileData.workArea || profileData.focusArea || "Carrera y empleabilidad");
          const sessions = Number(profileData.mentoringSessions || 0);

          return {
            id: String(item.id || ""),
            name,
            role: headline,
            area: specialty,
            rating: Number(profileData.rating || 5),
            sessions: Number.isFinite(sessions) ? sessions : 0,
            slots: String(profileData.availability || "Agenda flexible"),
            avatarUrl: String(item.avatarUrl || "") || undefined,
          } satisfies MentorItem;
        })
        .filter((mentor) => Boolean(mentor.id));
    },
  });

  return (
    <div>
      <PageHeader eyebrow="Mentores" title="Aprende de quien ya lo hizo" subtitle="Conecta con mentores reales para acelerar tu entrada al mercado laboral." />

      {isLoading ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando mentores...
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {mentors.map((m) => (
            <article key={m.id} className="rounded-2xl border border-border bg-card p-5">
              <header className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-semibold overflow-hidden">
                  {m.avatarUrl ? (
                    <img src={m.avatarUrl} alt={m.name} className="w-full h-full object-cover" />
                  ) : (
                    m.name.split(" ").map((n) => n[0]).slice(0, 2).join("")
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-subtitle font-semibold truncate">{m.name}</p>
                  <p className="text-xs text-muted-foreground font-sans truncate">{m.role}</p>
                </div>
                <div className="text-xs flex items-center gap-1 font-subtitle font-semibold">
                  <Star className="h-3.5 w-3.5 fill-primary text-primary" /> {m.rating.toFixed(1)}
                </div>
              </header>
              <p className="mt-3 text-sm font-subtitle font-semibold">{m.area}</p>
              <p className="mt-1 text-xs text-muted-foreground font-sans"><Calendar className="inline h-3 w-3 mr-1" />{m.slots} · {m.sessions} sesiones</p>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => navigate("/app/estudiante/mensajes")}
                  className="flex-1 h-9 rounded-lg bg-foreground text-background text-xs font-subtitle font-semibold"
                >
                  Contactar
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/app/estudiante/perfil/${m.id}`)}
                  className="h-9 px-3 rounded-lg border border-border text-xs font-subtitle font-semibold"
                >
                  Ver perfil
                </button>
              </div>
            </article>
          ))}

          {mentors.length === 0 && (
            <div className="md:col-span-2 rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Aún no hay mentores disponibles. Te avisaremos cuando se habiliten nuevos perfiles.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Mentores;
