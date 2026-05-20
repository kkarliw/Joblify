import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Sparkles, TrendingUp, MapPin } from "lucide-react";
import { PublicLayout as AppLayout } from "@/components/Layouts";
import { CompanyLogo } from "@/components/Brand";
import { useQuery } from "@tanstack/react-query";
import { jobsApi, userApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

type JobApiItem = {
  id: string;
  title: string;
  location?: string;
  modality?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  createdAt?: string;
  poster?: { name?: string };
  skills?: Array<{ skill?: { name?: string } }>;
};

const DEFAULT_TRENDING_TAGS = ["Product", "Frontend", "Backend", "Data", "Marketing", "Ventas", "UX", "IA"];

const normalizeModality = (value?: string) => {
  if (!value) return "Modalidad flexible";
  if (value === "REMOTO") return "Remoto";
  if (value === "HIBRIDO") return "Híbrido";
  if (value === "PRESENCIAL") return "Presencial";
  return value;
};

const formatSalary = (job: JobApiItem) => {
  if (typeof job.salaryMin === "number" && typeof job.salaryMax === "number") {
    return `${job.salaryCurrency || "USD"} ${job.salaryMin} - ${job.salaryMax}`;
  }
  return "Salario a convenir";
};

const formatPostedAt = (createdAt?: string) => {
  if (!createdAt) return "Reciente";
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "Reciente";
  return date.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
};

const Feed = () => {
  const { user } = useAuthStore();

  const { data: jobs = [] } = useQuery<JobApiItem[]>({
    queryKey: ["jobs", "feed", "public"],
    queryFn: async () => {
      const { data } = await jobsApi.list({ limit: 10 });
      if (Array.isArray(data)) return data as JobApiItem[];
      if (data && typeof data === "object" && Array.isArray((data as { jobs?: unknown }).jobs)) {
        return (data as { jobs: JobApiItem[] }).jobs;
      }
      return [];
    },
  });

  const { data: workAreas = [] } = useQuery<string[]>({
    queryKey: ["users", "work-areas"],
    queryFn: async () => {
      const { data } = await userApi.getWorkAreas();
      if (data && typeof data === "object" && Array.isArray((data as { areas?: unknown }).areas)) {
        return (data as { areas: string[] }).areas.filter(Boolean);
      }
      return [];
    },
  });

  const trendingTags = useMemo(
    () => (workAreas.length > 0 ? workAreas : DEFAULT_TRENDING_TAGS),
    [workAreas]
  );

  const name = user?.name?.split(" ")[0] || "Andrea";

  return (
    <AppLayout>
      <div className="grid lg:grid-cols-[260px_1fr_280px] gap-6">
        {/* Columna izquierda - perfil resumido */}
        <aside className="hidden lg:block space-y-4">
          <div className="bg-white border border-border rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                {name[0]}
              </div>
              <div className="min-w-0">
                <div className="font-subtitle font-semibold text-sm truncate">{user?.name || "Andrea"}</div>
                <div className="text-xs text-muted-foreground font-sans truncate">{user?.headline || "Talento"}</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border space-y-2">
              <div className="flex justify-between text-xs font-sans">
                <span className="text-muted-foreground">Perfil</span>
                <span className="font-subtitle font-semibold">{user?.profileCompletion || 65}%</span>
              </div>
              <progress
                value={user?.profileCompletion || 65}
                max={100}
                className="w-full h-1.5 rounded-full overflow-hidden [&::-webkit-progress-bar]:bg-surface-elevated [&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:bg-primary"
              />
            </div>
            <Link to="/app/talento/perfil" className="mt-3 text-xs text-primary font-subtitle font-semibold hover:underline">Completar perfil</Link>
          </div>
        </aside>

        {/* Columna central - feed */}
        <div>
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Hola, {name}</h1>
            <p className="mt-2 text-muted-foreground font-sans">Tienes {jobs.length} vacantes nuevas con alto match esta semana.</p>
          </div>

          <div className="mt-8 rounded-2xl p-5 flex items-center gap-4 bg-foreground text-background">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-subtitle font-semibold text-sm">Tu match score subió a 87</div>
              <div className="text-xs text-background/60 mt-0.5 font-sans">Completa tu portafolio para llegar al 95+</div>
            </div>
            <button className="text-xs font-subtitle font-semibold underline underline-offset-4 shrink-0">Mejorar perfil</button>
          </div>

          <div className="mt-10 flex items-center justify-between">
            <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight">Para ti</h2>
            <Link to="/vacantes" className="text-sm text-muted-foreground hover:text-foreground font-sans">Ver todas →</Link>
          </div>

          <div className="mt-6 grid sm:grid-cols-2 gap-4">
            {jobs.map(j => (
              <Link key={j.id} to={`/vacantes/${j.id}`} className="group p-6 rounded-2xl border border-border bg-white hover:border-foreground hover:shadow-[0_8px_30px_-12px_rgba(37,50,75,0.15)] transition-all">
                <div className="flex items-start justify-between">
                  <CompanyLogo initial={(j.poster?.name || "Empresa").slice(0, 1).toUpperCase()} />
                </div>
                <h3 className="mt-5 font-subtitle font-semibold text-base leading-snug">{j.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 font-sans">{j.poster?.name || "Empresa"}</p>
                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground font-sans">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{j.location || "Remoto"}</span>
                  <span>·</span>
                  <span>{normalizeModality(j.modality)}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {(Array.isArray(j.skills)
                    ? j.skills.map((entry) => entry.skill?.name).filter((name): name is string => Boolean(name))
                    : ["General"]
                  ).slice(0, 4).map((skill) => (
                    <span key={skill} className="text-[11px] font-medium px-2 py-1 rounded-md bg-primary/15 font-sans">{skill}</span>
                  ))}
                </div>
                <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-xs">
                  <span className="font-subtitle font-semibold">{formatSalary(j)}</span>
                  <span className="text-muted-foreground font-sans">{formatPostedAt(j.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="bg-white border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 text-sm font-subtitle font-semibold">
              <TrendingUp className="h-4 w-4 text-primary" />
              Trending hoy
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {trendingTags.slice(0, 10).map(t => (
                <button key={t} className="text-xs px-2.5 py-1 rounded-md bg-surface-elevated hover:bg-foreground hover:text-background transition-colors font-sans">{t}</button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-border rounded-2xl p-5">
            <h3 className="font-subtitle font-semibold text-sm">Eventos de la semana</h3>
            <div className="mt-4 space-y-4">
              {[
                { date: "JUE 18", title: "AMA con Head of Design de Rappi", time: "19:00 GMT-5" },
                { date: "VIE 19", title: "Workshop: Negociación salarial", time: "18:00 GMT-5" },
                { date: "SAB 20", title: "Demo day startups LATAM", time: "11:00 GMT-5" },
              ].map(e => (
                <div key={e.title} className="flex gap-3">
                  <div className="text-[10px] font-subtitle font-semibold text-primary mt-0.5 shrink-0 w-12">{e.date}</div>
                  <div>
                    <div className="text-sm font-subtitle font-medium leading-snug">{e.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 font-sans">{e.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </AppLayout>
  );
};

export default Feed;
