import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MessageSquare, Sparkles, ThumbsUp } from "lucide-react";
import { PublicLayout as AppLayout } from "@/components/Layouts";
import { Button } from "@/components/ui/button";
import { feedApi } from "@/lib/api";

type FeedPost = {
  id: string;
  content: string;
  createdAt: string;
  likesCount?: number;
  commentsCount?: number;
  author: {
    id: string;
    name: string;
    headline?: string;
    avatarUrl?: string;
  };
};

const Comunidad = () => {
  const { data: posts = [], isLoading, isFetching, isError } = useQuery<FeedPost[]>({
    queryKey: ["community", "public"],
    queryFn: async () => {
      const response = await feedApi.publicPosts(1);
      const payload = response.data;
      if (Array.isArray(payload)) return payload as FeedPost[];
      if (payload && typeof payload === "object" && Array.isArray((payload as { posts?: unknown }).posts)) {
        return (payload as { posts: FeedPost[] }).posts;
      }
      return [];
    },
  });

  return (
    <AppLayout>
      <section className="max-w-[1000px] mx-auto px-6 lg:px-10 py-10 lg:py-12">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Comunidad</h1>
          <p className="mt-2 text-muted-foreground font-sans">
            Conversaciones y publicaciones reales del ecosistema Joblify.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button asChild className="h-10 px-5 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-subtitle font-semibold">
              <Link to="/login">Iniciar sesión para participar</Link>
            </Button>
            <Button asChild variant="outline" className="h-10 px-5 rounded-xl font-subtitle">
              <Link to="/register/elegir">Crear cuenta</Link>
            </Button>
          </div>
        </div>

        <div className="mt-8 lg:mt-10">
          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground mb-5 font-sans">
            <span className="shrink-0">{posts.length} publicaciones recientes</span>
            {(isLoading || isFetching) && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>

          {isError ? (
            <div className="rounded-2xl border border-border bg-white p-6 text-sm text-muted-foreground">
              No pudimos cargar la comunidad ahora. Intenta de nuevo en unos segundos.
            </div>
          ) : (
            <div className="space-y-4">
              {posts.slice(0, 15).map((post) => {
                const initials = post.author?.name
                  ?.split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() || "JB";

                return (
                  <article key={post.id} className="rounded-2xl border border-border bg-white p-5">
                    <div className="flex items-start gap-3">
                      <div className="h-11 w-11 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-semibold overflow-hidden shrink-0">
                        {post.author?.avatarUrl ? (
                          <img src={post.author.avatarUrl} alt={post.author.name} className="w-full h-full object-cover" />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-subtitle font-semibold text-sm text-foreground truncate">{post.author?.name || "Miembro"}</p>
                        <p className="text-xs text-muted-foreground font-sans truncate">{post.author?.headline || "Comunidad Joblify"}</p>
                        <p className="mt-3 text-sm text-foreground font-sans whitespace-pre-wrap break-words">{post.content}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground font-sans">
                      <span>{new Date(post.createdAt).toLocaleDateString("es-CO", { day: "2-digit", month: "short" })}</span>
                      <div className="flex items-center gap-4">
                        <span className="inline-flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5" /> {post.likesCount || 0}</span>
                        <span className="inline-flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> {post.commentsCount || 0}</span>
                      </div>
                    </div>
                  </article>
                );
              })}

              {!isLoading && posts.length === 0 && (
                <div className="rounded-2xl border border-border bg-white p-8 text-center">
                  <Sparkles className="h-8 w-8 text-primary mx-auto" />
                  <h3 className="font-subtitle font-semibold text-foreground mt-3">Todavía no hay publicaciones públicas</h3>
                  <p className="text-sm text-muted-foreground mt-2">Sé de los primeros en compartir en la comunidad.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </AppLayout>
  );
};

export default Comunidad;
