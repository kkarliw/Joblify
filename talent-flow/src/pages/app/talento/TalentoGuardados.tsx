import { useMemo, useState } from "react";
import { Bookmark, Briefcase, FileText, MapPin, X, Loader2, Clock3, CircleDollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { CompanyLogo } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { savedApi } from "@/lib/api";
import { toast } from "sonner";

export type SavedJobItem = {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  summary?: string;
  location?: string;
  modality?: string;
  salary?: string;
  skills?: string[];
  savedAt: string;
};

export type SavedPostItem = {
  id: string;
  authorName: string;
  authorAvatarUrl?: string;
  content: string;
  createdAt?: string;
  savedAt: string;
};

const TalentoGuardados = () => {
  const [tab, setTab] = useState<"vacantes" | "posts">("vacantes");
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading: loadingJobs } = useQuery<SavedJobItem[]>({
    queryKey: ["saved", "jobs"],
    queryFn: () => savedApi.getJobs().then(res => res.data),
  });

  const { data: posts = [], isLoading: loadingPosts } = useQuery<SavedPostItem[]>({
    queryKey: ["saved", "posts"],
    queryFn: () => savedApi.getPosts().then(res => res.data),
  });

  const toggleJob = useMutation({
    mutationFn: (id: string) => savedApi.toggleJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved", "jobs"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Vacante removida de guardados");
    }
  });

  const togglePost = useMutation({
    mutationFn: (id: string) => savedApi.togglePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved", "posts"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Post removido de guardados");
    }
  });

  const total = jobs.length + posts.length;
  const isLoading = loadingJobs || loadingPosts;

  return (
    <div>
      <PageHeader
        eyebrow="Biblioteca"
        title="Guardados"
        subtitle={`Tienes ${total} elementos guardados para revisar luego.`}
      />

      <div className="flex gap-2 mb-5">
        <Button variant={tab === "vacantes" ? "default" : "outline"} className="rounded-full" onClick={() => setTab("vacantes")}>
          <Briefcase className="h-4 w-4" /> Vacantes ({jobs.length})
        </Button>
        <Button variant={tab === "posts" ? "default" : "outline"} className="rounded-full" onClick={() => setTab("posts")}>
          <FileText className="h-4 w-4" /> Posts ({posts.length})
        </Button>
      </div>

      {tab === "vacantes" ? (
        <div className="space-y-3">
          {jobs.map((job) => (
            <article key={job.id} className="rounded-2xl border border-border bg-card p-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <CompanyLogo
                    initial={job.company.slice(0, 1).toUpperCase()}
                    imageUrl={job.companyLogo}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-subtitle font-semibold truncate">{job.company}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Guardada el {new Date(job.savedAt).toLocaleDateString("es-ES")}</p>
                  </div>
                </div>

                <div className="rounded-lg bg-[#F5F5F7] px-3 py-1.5 text-right shrink-0">
                  <p className="text-sm font-subtitle font-semibold text-foreground">{job.salary || "A convenir"}</p>
                </div>
              </div>

              <h3 className="mt-3 font-subtitle font-semibold text-[30px] leading-tight tracking-tight">{job.title}</h3>

              <div className="mt-2 text-xs text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
                {job.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {job.location}</span>}
                {job.modality && <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {job.modality}</span>}
                {job.salary && <span className="inline-flex items-center gap-1"><CircleDollarSign className="h-3.5 w-3.5" /> {job.salary}</span>}
                <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> Guardada</span>
              </div>

              {Array.isArray(job.skills) && job.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {job.skills.slice(0, 5).map((skill) => (
                    <span key={skill} className="text-[11px] px-2.5 py-1 rounded-md border border-border bg-surface-elevated text-foreground/80 font-sans">
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              <p className="mt-2 text-sm text-muted-foreground font-sans line-clamp-2">
                {job.summary || "Abre esta vacante para revisar responsabilidades y requisitos antes de aplicar."}
              </p>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-end gap-2">
                <Link to={`/app/talento/vacantes/${job.id}`} className="inline-flex text-xs font-subtitle font-semibold text-primary hover:underline">
                  Ver vacante
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => toggleJob.mutate(job.id)}
                  disabled={toggleJob.isPending}
                >
                  {toggleJob.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />} Quitar
                </Button>
              </div>
            </article>
          ))}

          {jobs.length === 0 && !isLoading && (
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <Bookmark className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Aún no guardas vacantes.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <article key={post.id} className="rounded-2xl border border-border bg-card p-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">{post.authorName}</h3>
                <p className="text-sm text-foreground/90 mt-2 line-clamp-3">{post.content}</p>
                <p className="text-xs text-muted-foreground mt-2">Guardado el {new Date(post.savedAt).toLocaleDateString("es-ES")}</p>
                <Link to="/app/talento" className="inline-flex mt-2 text-xs font-semibold text-primary hover:underline">
                  Ir al feed
                </Link>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => togglePost.mutate(post.id)}
                disabled={togglePost.isPending}
              >
                {togglePost.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />} Quitar
              </Button>
            </article>
          ))}

          {posts.length === 0 && !isLoading && (
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <Bookmark className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Aún no guardas posts.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TalentoGuardados;
