import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Share2, Image as ImageIcon, Sparkles, TrendingUp, Send, Zap, Loader2, MessageSquare, CornerDownRight, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { aiApi, feedApi, savedApi } from "@/lib/api";
import { roleLabel, roleToSlug, type UserRole, useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

type FeedPost = {
  id: string;
  content: string;
  createdAt: string;
  tag?: string;
  likesCount: number;
  commentsCount: number;
  likedByMe: boolean;
  isPinned?: boolean;
  author: {
    id: string;
    name: string;
    avatarUrl?: string;
    headline?: string;
    role: string;
  };
};

const looksLikeRefusal = (text: string) => {
  const normalized = text.toLowerCase();
  return normalized.includes("lo siento") || normalized.includes("no puedo") || normalized.includes("no puedo cumplir") || normalized.includes("cannot");
};

const buildFallbackImprovedPost = (draft: string) => {
  const clean = draft.trim().replace(/\s+/g, " ");
  if (!clean) return "";

  if (/quiero\s+un\s+trabajo|busco\s+trabajo|buscando\s+trabajo/i.test(clean)) {
    return "Hola comunidad, estoy buscando una oportunidad laboral para seguir creciendo profesionalmente. Si conocen vacantes o pueden recomendarme, se los agradecería mucho.";
  }

  const capitalized = clean.charAt(0).toUpperCase() + clean.slice(1);
  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`;
};

type FeedComment = {
  id: string;
  content: string;
  createdAt: string;
  author: {
    name: string;
    avatarUrl?: string;
  };
};

const FeedComposer = ({
  onPost,
  isPending,
  onImprove,
  isImproving,
}: {
  onPost: (text: string) => void;
  isPending: boolean;
  onImprove: (text: string, applyResult: (value: string) => void) => void;
  isImproving: boolean;
}) => {
  const { user } = useAuthStore();
  const [text, setText] = useState("");
  
  if (!user) return null;

  const placeholder = user.role === "empresa"
    ? "Anuncia una vacante, comparte cultura, busca talento…"
    : user.role === "freelancer"
    ? "Comparte un proyecto, un tip o un brief abierto…"
    : "¿Qué estás pensando? Logros, preguntas, ideas…";

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm mb-6">
      <div className="flex gap-3">
        <div className="h-10 w-10 rounded-full bg-surface-elevated text-foreground flex items-center justify-center text-xs font-semibold shrink-0 overflow-hidden relative border border-border">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <span>{user.name?.[0]?.toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={placeholder}
            rows={2}
            className="w-full resize-none bg-transparent text-sm font-sans placeholder:text-muted-foreground focus:outline-none"
          />
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
            <div className="flex items-center gap-1">
              <button className="h-8 w-8 rounded-lg hover:bg-surface-elevated flex items-center justify-center text-muted-foreground transition-colors" aria-label="Adjuntar imagen">
                <ImageIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onImprove(text, setText)}
                disabled={!text.trim() || isImproving}
                className="h-8 px-2 rounded-lg hover:bg-surface-elevated flex items-center gap-1 text-xs text-muted-foreground font-subtitle transition-colors disabled:opacity-50"
              >
                {isImproving ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> : <Sparkles className="h-3.5 w-3.5 text-primary" />} Mejorar con IA
              </button>
            </div>
            <button
              onClick={() => { if (text.trim()) { onPost(text.trim()); setText(""); } }}
              disabled={!text.trim() || isPending}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-foreground text-background text-xs font-subtitle font-semibold disabled:opacity-40 hover:bg-foreground/90 transition-colors"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Publicar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PostCard = ({ post }: { post: FeedPost }) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const profileUrl = user
    ? `/app/${roleToSlug(user.role)}/perfil/${post.author.id}`
    : "/login";

  const { data: savedPosts = [] } = useQuery<Array<{ id: string }>>({
    queryKey: ["saved", "posts"],
    queryFn: () => savedApi.getPosts().then((res) => res.data),
  });
  const isSaved = savedPosts.some((savedPost) => savedPost.id === post.id);

  const toggleSave = useMutation({
    mutationFn: () => savedApi.togglePost(post.id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["saved", "posts"] });
      toast.success(res.data.saved ? "Post guardado" : "Post removido de guardados");
    },
    onError: () => toast.error("Error al guardar post"),
  });

  const toggleLike = useMutation({
    mutationFn: (postId: string) => feedApi.likePost(postId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feed"] })
  });

  const { data: comments = [], isLoading: loadingComments } = useQuery<FeedComment[]>({
    queryKey: ["comments", post.id],
    queryFn: () => feedApi.comments(post.id).then(res => res.data),
    enabled: showComments,
  });

  const createComment = useMutation({
    mutationFn: async (content: string) => {
      const moderation = await aiApi.moderateContent(content, "comment");
      const moderationData = moderation.data as { allowed?: boolean; reason?: string; sanitizedText?: string };
      if (moderationData.allowed === false) {
        throw new Error(moderationData.reason || "Tu comentario no pasó la moderación IA");
      }
      const finalContent = moderationData.sanitizedText?.trim() || content.trim();
      return feedApi.addComment(post.id, finalContent);
    },
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["comments", post.id] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Comentario publicado");
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : "Error al comentar")
  });

  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      {post.isPinned && (
        <div className="text-[10px] font-subtitle font-semibold uppercase tracking-wider text-primary mb-3 flex items-center gap-1">
          <Sparkles className="h-3 w-3" /> Destacado
        </div>
      )}
      <header className="flex items-start gap-3">
        <Link to={profileUrl} className="h-12 w-12 rounded-full bg-surface-elevated text-foreground flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden relative border border-border/50 hover:opacity-90 transition">
          {post.author.avatarUrl ? (
            <img src={post.author.avatarUrl} alt={post.author.name} className="w-full h-full object-cover" />
          ) : (
            <span>{post.author.name?.[0]?.toUpperCase()}</span>
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <Link to={profileUrl} className="block">
            <h4 className="text-sm font-subtitle font-semibold text-foreground truncate hover:text-primary transition-colors">{post.author.name}</h4>
            <p className="text-xs text-muted-foreground truncate">{post.author.headline || roleLabel[post.author.role as UserRole]}</p>
          </Link>
          <p className="text-[10px] text-muted-foreground/80 mt-0.5 font-sans">
            {new Date(post.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
          </p>
        </div>
      </header>

      {post.tag && (
        <Badge variant="secondary" className="mt-3 mb-2 font-subtitle">
          #{post.tag}
        </Badge>
      )}

      <p className="mt-3 text-sm font-sans text-foreground/90 leading-relaxed whitespace-pre-wrap">
        {post.content}
      </p>
      
      <footer className="mt-4 pt-3 flex items-center gap-6 border-t border-border">
        <button
          onClick={() => toggleLike.mutate(post.id)}
          className={cn(
            "flex items-center gap-1.5 text-xs font-subtitle font-medium transition-colors hover:text-primary",
            post.likedByMe ? "text-primary" : "text-muted-foreground"
          )}
        >
          <Heart className={cn("h-4 w-4", post.likedByMe && "fill-primary")} />
          <span>{post.likesCount} me gusta</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-xs font-subtitle font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageSquare className="h-4 w-4" />
          <span>{post.commentsCount} comentarios</span>
        </button>
        <button className="flex items-center gap-1.5 text-xs font-subtitle font-medium text-muted-foreground hover:text-foreground transition-colors ml-auto">
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">Compartir</span>
        </button>
        <button
          onClick={() => toggleSave.mutate()}
          disabled={toggleSave.isPending}
          className={cn(
            "flex items-center gap-1.5 text-xs font-subtitle font-medium transition-colors disabled:opacity-50",
            isSaved ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Bookmark className={cn("h-4 w-4", isSaved && "fill-primary")} />
          <span className="hidden sm:inline">{isSaved ? "Guardado" : "Guardar"}</span>
        </button>
      </footer>

      {showComments && (
        <div className="mt-4 pt-4 border-t border-border space-y-4">
          <div className="flex gap-2">
            <div className="h-8 w-8 rounded-full bg-surface-elevated flex items-center justify-center shrink-0 overflow-hidden relative border border-border">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Yo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold">{user?.name?.[0]?.toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1 flex bg-surface-elevated rounded-full px-3 py-1.5 items-center border border-transparent focus-within:border-border transition-colors">
              <input
                type="text"
                placeholder="Escribe un comentario..."
                className="flex-1 bg-transparent text-sm font-sans outline-none placeholder:text-muted-foreground"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && commentText.trim()) {
                    createComment.mutate(commentText);
                  }
                }}
              />
              <button
                onClick={() => createComment.mutate(commentText)}
                disabled={!commentText.trim() || createComment.isPending}
                className="h-6 w-6 rounded-full bg-foreground text-background flex items-center justify-center hover:bg-foreground/90 disabled:opacity-50"
              >
                {createComment.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CornerDownRight className="h-3 w-3" />}
              </button>
            </div>
          </div>

          <div className="space-y-3 pl-2">
            {loadingComments ? (
              <div className="flex justify-center py-2"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
            ) : comments.map((comment) => (
              <div key={comment.id} className="flex gap-2.5">
                <div className="h-7 w-7 rounded-full bg-surface-elevated flex items-center justify-center shrink-0 overflow-hidden relative border border-border/50">
                  {comment.author.avatarUrl ? (
                    <img src={comment.author.avatarUrl} alt={comment.author.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold">{comment.author.name?.[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="bg-surface-elevated rounded-2xl rounded-tl-sm px-3 py-2 inline-block max-w-full">
                    <p className="text-xs font-subtitle font-bold text-foreground">{comment.author.name}</p>
                    <p className="text-xs font-sans text-foreground/90 mt-0.5">{comment.content}</p>
                  </div>
                  <p className="text-[9px] font-sans text-muted-foreground mt-1 ml-1">
                    {new Date(comment.createdAt).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
};

export const SocialFeed = ({ role }: { role: UserRole }) => {
  const queryClient = useQueryClient();

  const { data: feedData, isLoading } = useQuery({
    queryKey: ["feed", role],
    queryFn: () => feedApi.posts(1).then(res => res.data),
  });

  const createPost = useMutation({
    mutationFn: async (content: string) => {
      const moderation = await aiApi.moderateContent(content, "post");
      const moderationData = moderation.data as { allowed?: boolean; reason?: string; sanitizedText?: string };
      if (moderationData.allowed === false) {
        throw new Error(moderationData.reason || "La publicación no pasó la moderación IA");
      }
      const finalContent = moderationData.sanitizedText?.trim() || content.trim();
      return feedApi.createPost({ content: finalContent, tag: "General" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Publicación creada");
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : "Error al publicar")
  });

  const improveDraft = useMutation({
    mutationFn: (draft: string) =>
      aiApi.chat(
        `Tarea de edición de texto. Reescribe el siguiente post en español LATAM para que suene más claro, profesional y cercano. Mantén la intención original y no inventes datos. Devuelve únicamente el texto final del post, sin explicaciones ni prefacios.\n\nPOST ORIGINAL:\n${draft}`,
        "career_advice",
      ),
  });

  const posts = feedData || [];

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start max-w-[1200px] mx-auto mt-4">
      {/* Columna Principal: Feed */}
      <div className="flex-1 w-full min-w-0">
        <FeedComposer
          onPost={(text) => createPost.mutate(text)}
          isPending={createPost.isPending}
          isImproving={improveDraft.isPending}
          onImprove={(text, applyResult) => {
            if (!text.trim()) {
              toast.error("Escribe algo antes de mejorar con IA");
              return;
            }

            improveDraft.mutate(text, {
              onSuccess: (response) => {
                const improved = (response.data as { reply?: string }).reply?.trim();
                if (!improved) {
                  applyResult(buildFallbackImprovedPost(text));
                  toast.error("La IA no devolvió texto; aplicamos mejora básica");
                  return;
                }
                if (looksLikeRefusal(improved)) {
                  applyResult(buildFallbackImprovedPost(text));
                  toast.error("La IA rechazó la solicitud; aplicamos mejora básica");
                  return;
                }
                applyResult(improved);
                toast.success("Texto mejorado con IA");
              },
              onError: () => {
                toast.error("No se pudo mejorar el texto con IA");
              },
            });
          }}
        />

        {isLoading ? (
          <div className="py-12 flex justify-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-4">
            {posts.map((post: FeedPost) => (
              <PostCard key={post.id} post={post} />
            ))}

            {posts.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-border">
                <Zap className="h-12 w-12 text-yellow-400 mx-auto mb-4 opacity-50" />
                <h3 className="font-semibold text-gray-900">La comunidad está tranquila</h3>
                <p className="text-sm text-gray-500 mt-1">
                  ¡Sé el primero en compartir algo interesante hoy!
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Columna Lateral Derecha */}
      <aside className="hidden lg:block w-[300px] shrink-0 space-y-6">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sticky top-28">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-subtitle font-semibold">Tendencias</h3>
          </div>
          <div className="space-y-3">
            {[
              { tag: "#hiring2026", count: "2.5k posts" },
              { tag: "#remoteLATAM", count: "1.8k posts" },
              { tag: "#productdesign", count: "3.2k posts" },
              { tag: "#freelancetips", count: "4.1k posts" },
              { tag: "#techlayoffs", count: "1.2k posts" }
            ].map(t => (
              <div key={t.tag} className="flex justify-between items-center group cursor-pointer">
                <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">{t.tag}</span>
                <span className="text-[10px] text-muted-foreground bg-surface-elevated px-2 py-0.5 rounded-md">{t.count}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
};
