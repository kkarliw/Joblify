import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Rocket, Users, ArrowRight } from "lucide-react";
import { startupApi } from "@/lib/api";

type StartupItem = {
  id: string;
  name: string;
  description: string;
  tagline?: string | null;
  stage: string;
  openRoles?: Array<{ id: string; title: string }>;
  _count?: { applications?: number };
};

const StartupProyectos = () => {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["startups", "my-owned"],
    queryFn: () => startupApi.myOwned().then((res) => res.data as StartupItem[]),
  });

  return (
    <div>
      <PageHeader eyebrow="Tus proyectos" title="Mis startups" subtitle="Gestiona los proyectos que estás liderando y la búsqueda de equipo." />
      <div className="grid md:grid-cols-2 gap-4">
        {isLoading && (
          <article className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
            Cargando proyectos...
          </article>
        )}

        {!isLoading && projects.length === 0 && (
          <article className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground space-y-3">
            <p>Todavía no publicaste startups. Usa el botón de publicar para crear tu primer proyecto.</p>
            <Link to="/app/startup/publicar" className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
              Publicar ahora <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </article>
        )}

        {!isLoading &&
          projects.map((project) => (
            <article key={project.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Rocket className="h-4 w-4 text-primary" />
                    <h3 className="font-subtitle font-semibold text-lg">{project.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground font-sans mt-1 line-clamp-2">{project.description}</p>
                </div>
                <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-surface-elevated font-subtitle font-semibold">{project.stage}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {(project.openRoles || []).slice(0, 4).map((role) => (
                  <span key={role.id} className="text-xs px-2 py-1 rounded-md bg-primary/15 font-subtitle font-semibold">{role.title}</span>
                ))}
                {(project.openRoles || []).length === 0 && <span className="text-xs text-muted-foreground">Sin roles publicados aún</span>}
              </div>
              <footer className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-sans">
                  <Users className="inline h-3.5 w-3.5 mr-1" />
                  {project._count?.applications || 0} postulantes
                </span>
                <Link to={`/app/startup/proyectos/${project.id}`} className="inline-flex items-center gap-1 font-subtitle font-semibold">
                  Ver detalle <ArrowRight className="h-4 w-4" />
                </Link>
              </footer>
            </article>
          ))}
      </div>
    </div>
  );
};

export default StartupProyectos;
