import { Plus, Eye, Users, Edit2, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { applicationsApi, jobsApi } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const statusBadge = (status?: string) => {
  const normalized = status?.toLowerCase();
  if (normalized === "active") return "bg-emerald-500/15 text-emerald-700";
  if (normalized === "paused") return "bg-amber-500/15 text-amber-700";
  if (normalized === "draft") return "bg-surface-elevated text-muted-foreground";
  if (normalized === "closed") return "bg-rose-500/15 text-rose-700";
  return "bg-surface-elevated text-muted-foreground";
};

const EmpresaVacantes = () => {
  const queryClient = useQueryClient();

  type JobItem = {
    id: string;
    title: string;
    location?: string;
    modality?: string;
    status?: string;
    createdAt?: string;
    viewCount?: number;
    _count?: {
      applications?: number;
    };
  };

  const { data, isLoading } = useQuery<JobItem[]>({
    queryKey: ["empresa", "vacantes", "my"],
    queryFn: () => jobsApi.myPosted().then((r) => (Array.isArray(r.data) ? (r.data as JobItem[]) : [])),
  });

  const jobs: JobItem[] = data || [];

  const closeJobMutation = useMutation({
    mutationFn: (jobId: string) => applicationsApi.closeJob(jobId),
    onSuccess: (response) => {
      const affected = (response.data as { affected?: number }).affected || 0;
      toast.success(`Vacante cerrada. ${affected} postulación(es) notificadas.`);
      queryClient.invalidateQueries({ queryKey: ["empresa", "vacantes", "my"] });
      queryClient.invalidateQueries({ queryKey: ["empresa", "pipeline", "applications"] });
      queryClient.invalidateQueries({ queryKey: ["empresa", "candidatos", "ranked"] });
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || "No se pudo cerrar la vacante";
      toast.error(message);
    },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Reclutamiento"
        title="Tus vacantes"
        subtitle="Gestiona, edita y mide el rendimiento de cada oferta."
        action={
          <Link to="/app/empresa/publicar" className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-foreground text-background text-sm font-subtitle font-semibold hover:bg-foreground/90">
            <Plus className="h-4 w-4" /> Nueva vacante
          </Link>
        }
      />

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-12 px-5 py-3 border-b border-border text-[10px] font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">
          <div className="col-span-4">Vacante</div>
          <div className="col-span-2 text-center">Estado</div>
          <div className="col-span-2 text-center">Vistas</div>
          <div className="col-span-2 text-center">Aplicaciones</div>
          <div className="col-span-2 text-right">Acciones</div>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 px-5 py-4 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Cargando vacantes…</div>
        )}

        {!isLoading && jobs.length === 0 && (
          <div className="px-5 py-6 text-sm text-muted-foreground">Aún no tienes vacantes creadas.</div>
        )}

        {!isLoading && jobs.length > 0 && (
          <ul className="divide-y divide-border">
            {jobs.map((j: JobItem) => (
              <li key={j.id} className="grid grid-cols-12 px-5 py-4 items-center hover:bg-surface-elevated/50 transition-colors">
                <div className="col-span-4 min-w-0">
                  <p className="text-sm font-subtitle font-semibold truncate">{j.title}</p>
                  <p className="text-xs text-muted-foreground font-sans">{j.location || "Remoto"} · {j.modality || "N/A"}</p>
                  {j.createdAt && (
                    <p className="text-[11px] text-muted-foreground font-sans">{formatDistanceToNow(new Date(j.createdAt), { addSuffix: true, locale: es })}</p>
                  )}
                </div>
                <div className="col-span-2 text-center">
                  <span className={`text-[10px] font-subtitle font-semibold uppercase px-2 py-1 rounded-full ${statusBadge(j.status)}`}>
                    {j.status || "Sin estado"}
                  </span>
                </div>
                <div className="col-span-2 text-center text-sm font-subtitle font-semibold inline-flex items-center justify-center gap-1">
                  <Eye className="h-3 w-3 text-muted-foreground" /> {j.viewCount ?? "—"}
                </div>
                <div className="col-span-2 text-center text-sm font-subtitle font-semibold inline-flex items-center justify-center gap-1">
                  <Users className="h-3 w-3 text-muted-foreground" /> {j._count?.applications ?? "—"}
                </div>
                <div className="col-span-2 flex items-center justify-end gap-1.5">
                  <Link
                    to={`/app/empresa/publicar?edit=${j.id}`}
                    aria-label="Editar vacante"
                    title="Editar vacante"
                    className="h-8 w-8 rounded-lg hover:bg-surface-elevated flex items-center justify-center"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    to={`/app/empresa/vacantes/${j.id}`}
                    aria-label="Ver vacante"
                    title="Ver vacante"
                    className="h-8 w-8 rounded-lg hover:bg-surface-elevated flex items-center justify-center"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    to="/app/empresa/candidatos"
                    aria-label="Ver candidatos"
                    title="Ver candidatos"
                    className="h-8 w-8 rounded-lg hover:bg-surface-elevated flex items-center justify-center"
                  >
                    <Users className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      const confirmed = window.confirm("¿Seguro que quieres cerrar esta vacante? Se notificará a postulantes en proceso.");
                      if (confirmed) closeJobMutation.mutate(j.id);
                    }}
                    disabled={closeJobMutation.isPending || (j.status || "").toLowerCase() === "closed"}
                    className="h-8 px-2 rounded-lg border border-border text-[10px] font-subtitle font-semibold uppercase tracking-wider hover:bg-surface-elevated disabled:opacity-50"
                  >
                    Cerrar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default EmpresaVacantes;
