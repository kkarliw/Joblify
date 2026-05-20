import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuthStore, homeForRole, roleToSlug } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Clock,
  Sparkles,
  TrendingUp,
  Users,
  Building2,
  GraduationCap,
  Bookmark,
  Zap,
  ChevronRight,
  Loader2,
  Send,
  Heart,
  MessageSquare,
  CornerDownRight
} from "lucide-react";
import { jobsApi, feedApi, applicationsApi, savedApi, aiApi } from "@/lib/api";
import { toast } from "sonner";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  modality: string;
  type: string;
  matchScore?: number;
  postedAt: string;
  skills: string[];
}

interface FeedPost {
  id: string;
  author: {
    name: string;
    avatarUrl?: string;
    headline?: string;
  };
  content: string;
  tag?: string;
  likesCount: number;
  commentsCount: number;
  likedByMe: boolean;
  createdAt: string;
}

interface ApplicationItem {
  id: string;
  status?: string;
  job?: {
    title?: string;
    poster?: {
      name?: string;
    };
  };
}

const POST_TAG_OPTIONS = [
  "Vacante",
  "Proyecto",
  "Actualización",
  "Networking",
  "Logro",
];

interface Recommendation {
  id: string;
  score: number;
  reason: string;
}

interface RecommendationsResponse {
  recommendations: Recommendation[];
}

interface FeedComment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    name: string;
    avatarUrl?: string;
  };
}

const DashboardPostCard = ({
  post,
  onLike,
  isSaved,
  onToggleSave,
}: {
  post: FeedPost;
  onLike: (postId: string) => void;
  isSaved: boolean;
  onToggleSave: (postId: string) => void;
}) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const { data: comments = [], isLoading: loadingComments } = useQuery<FeedComment[]>({
    queryKey: ["panel-comments", post.id],
    queryFn: () => feedApi.comments(post.id).then((res) => res.data),
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
      queryClient.invalidateQueries({ queryKey: ["panel-comments", post.id] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Comentario publicado");
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "No se pudo comentar");
    },
  });

  return (
    <Card className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center overflow-hidden relative">
          {post.author.avatarUrl ? (
            <img src={post.author.avatarUrl} alt={post.author.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-lg font-bold text-purple-600">
              {post.author.name?.[0]?.toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">{post.author.name}</h4>
          <p className="text-xs text-gray-500">{post.author.headline}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(post.createdAt).toLocaleDateString('es-ES')}
          </p>
        </div>
      </div>

      {post.tag && (
        <Badge variant="secondary" className="mt-3 mb-2">
          {post.tag}
        </Badge>
      )}

      <p className="text-gray-700 mt-2 text-sm leading-relaxed whitespace-pre-wrap">
        {post.content}
      </p>

      <div className="flex items-center gap-6 mt-4 pt-3 border-t text-sm text-gray-500">
        <button
          onClick={() => onLike(post.id)}
          className={`flex items-center gap-1.5 hover:text-primary transition-colors ${post.likedByMe ? 'text-primary' : ''}`}
        >
          <Heart className={`h-4 w-4 ${post.likedByMe ? 'fill-primary' : ''}`} />
          <span>{post.likesCount} me gusta</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 hover:text-primary transition-colors"
        >
          <MessageSquare className="h-4 w-4" />
          <span>{post.commentsCount} comentarios</span>
        </button>
        <button
          onClick={() => onToggleSave(post.id)}
          className={`flex items-center gap-1.5 hover:text-primary transition-colors ${isSaved ? "text-primary" : ""}`}
        >
          <Bookmark className={`h-4 w-4 ${isSaved ? "fill-primary" : ""}`} />
          <span>{isSaved ? "Guardado" : "Guardar"}</span>
        </button>
      </div>

      {showComments && (
        <div className="mt-4 pt-4 border-t border-border space-y-3">
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
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && commentText.trim()) {
                    createComment.mutate(commentText.trim());
                  }
                }}
              />
              <button
                onClick={() => createComment.mutate(commentText.trim())}
                disabled={!commentText.trim() || createComment.isPending}
                aria-label="Enviar comentario"
                title="Enviar comentario"
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
    </Card>
  );
};

const HomeFeed = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostLocation, setNewPostLocation] = useState("");
  const [newPostTag, setNewPostTag] = useState("");
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);

  const { data: feedData, isLoading: loadingFeed } = useQuery({
    queryKey: ["feed"],
    queryFn: () => feedApi.posts(1).then(res => res.data),
    enabled: !!user
  });

  const { data: jobsData, isLoading: loadingJobs } = useQuery({
    queryKey: ["jobs", "feed"],
    queryFn: () => jobsApi.list({ limit: 30 }).then(res => res.data?.jobs || []),
    enabled: !!user && user.role !== "empresa" // Empresas no ven jobs recomendados en su feed
  });

  const { data: recommendationsData, isLoading: loadingRecommendations } = useQuery<RecommendationsResponse>({
    queryKey: ["ai", "panel-recommendations", user?.id],
    queryFn: async () => {
      const { data } = await aiApi.recommendations();
      return data as RecommendationsResponse;
    },
    enabled: !!user && user.role !== "empresa",
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });

  const { data: appsData, isLoading: loadingApps } = useQuery({
    queryKey: ["applications", "my"],
    queryFn: () => applicationsApi.my().then(res => res.data),
    enabled: !!user && user.role !== "empresa"
  });

  const { data: savedPostsData = [] } = useQuery<Array<{ id: string }>>({
    queryKey: ["saved", "posts"],
    queryFn: () => savedApi.getPosts().then((res) => res.data),
    enabled: !!user,
  });

  const createPost = useMutation({
    mutationFn: async (payload: { content: string; tag?: string }) => {
      const moderation = await aiApi.moderateContent(payload.content, "post");
      const moderationData = moderation.data as { allowed?: boolean; reason?: string; sanitizedText?: string };
      if (moderationData.allowed === false) {
        throw new Error(moderationData.reason || "La publicación no pasó la moderación IA");
      }
      const finalContent = moderationData.sanitizedText?.trim() || payload.content.trim();
      return feedApi.createPost({ ...payload, content: finalContent });
    },
    onSuccess: () => {
      setNewPostContent("");
      setNewPostLocation("");
      setNewPostTag("");
      setShowLocationInput(false);
      setShowTagPicker(false);
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Publicación creada");
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : "Error al publicar")
  });

  const toggleLike = useMutation({
    mutationFn: (postId: string) => feedApi.likePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    }
  });

  const toggleSavedPost = useMutation({
    mutationFn: (postId: string) => savedApi.togglePost(postId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["saved", "posts"] });
      toast.success(res.data.saved ? "Post guardado" : "Post removido de guardados");
    },
    onError: () => toast.error("No se pudo actualizar guardados"),
  });

  if (!user) return <Navigate to="/login" replace />;

  const posts: FeedPost[] = feedData || [];
  const jobs: Job[] = jobsData || [];
  const applications = appsData || [];
  const savedPostIds = new Set(savedPostsData.map((savedPost) => savedPost.id));
  const loading = loadingFeed || loadingJobs || loadingApps || loadingRecommendations;

  const jobsById = new Map(jobs.map((job) => [job.id, job]));
  const recommendedWeeklyJobs = (recommendationsData?.recommendations || [])
    .filter((rec) => rec.score >= 70)
    .map((rec) => ({ rec, job: jobsById.get(rec.id) }))
    .filter((item): item is { rec: Recommendation; job: Job } => Boolean(item.job))
    .sort((a, b) => b.rec.score - a.rec.score)
    .slice(0, 2);

  const profileCompletion = user.profileCompletion || 0;
  const roleSlug = roleToSlug(user.role);
  const roleLabel = {
    candidato: "Talento",
    empresa: "Empresa",
    freelancer: "Freelancer",
    emprendedor: "Emprendedor",
    estudiante: "Estudiante"
  }[user.role] || "Usuario";

  const handlePost = () => {
    if (!newPostContent.trim()) return;

    const normalizedLocation = newPostLocation.trim();
    const tagParts = [newPostTag.trim(), normalizedLocation ? `Ubicación: ${normalizedLocation}` : ""].filter(Boolean);

    createPost.mutate({
      content: newPostContent.trim(),
      tag: tagParts.length > 0 ? tagParts.join(" • ") : undefined,
    });
  };

  return (
    <>
      <div className="w-full mx-auto pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8">
          
          {/* ─── COLUMNA IZQUIERDA: Perfil ───────────────────────── */}
          <div className="lg:col-span-3 space-y-6">
            {/* Card Perfil */}
            <Card className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div 
                className="h-20 bg-gradient-to-r from-blue-500 to-blue-600 relative overflow-hidden"
              >
                {user.coverUrl && (
                  <img src={user.coverUrl} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
                )}
              </div>
              <div className="px-4 pb-4 -mt-10">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-white p-1 shadow-sm flex items-center justify-center font-bold text-gray-500 text-2xl overflow-hidden mx-auto border-4 border-white relative">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span>{user.name?.[0]?.toUpperCase()}</span>
                    )}
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <h2 className="font-semibold text-gray-900">{user.name}</h2>
                  <p className="text-sm text-gray-500">{user.headline || roleLabel}</p>
                  <p className="text-xs text-gray-400 mt-1">{user.location || "Sin ubicación"}</p>
                </div>
              </div>
              
              <div className="border-t px-4 py-3 bg-gray-50/50">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Apariciones en búsquedas</span>
                  <span className="font-semibold text-blue-600">24</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Visualizaciones de perfil</span>
                  <span className="font-semibold text-blue-600">8</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Match Score Promedio</span>
                  <span className="font-semibold text-green-600">85%</span>
                </div>
              </div>
            </Card>

            {/* Accesos rápidos */}
            <Card className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">Accesos rápidos</h3>
              <div className="space-y-1">
                <Link to={`/app/${roleSlug}/aplicaciones`} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <Briefcase className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-700">Mis aplicaciones</span>
                </Link>
                <Link to={`/app/${roleSlug}/guardados`} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <Bookmark className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-700">Guardados</span>
                </Link>
                <Link to={`/app/${roleSlug}/mensajes`} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <Users className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-700">Mensajes</span>
                </Link>
              </div>
            </Card>
          </div>

          {/* ─── COLUMNA CENTRAL: Dashboard ─────────────────────────── */}
          <div className="lg:col-span-6 space-y-8">
            
            {loading ? (
              <div className="text-center py-12 flex flex-col items-center text-gray-500">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                Cargando tu dashboard...
              </div>
            ) : (
              <>
                {/* 1. MATCH DE IA SEMANAL */}
                {user.role !== "empresa" && (
                  <div className="space-y-4">
                    <h3 className="font-display text-xl font-bold flex items-center gap-2 text-gray-900">
                      <Sparkles className="h-6 w-6 text-yellow-500" />
                      Match de IA Semanal
                    </h3>
                    {recommendedWeeklyJobs.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recommendedWeeklyJobs.map(({ rec, job }) => (
                        <Card key={job.id} className="bg-gradient-to-br from-white to-primary/5 rounded-2xl p-5 shadow-sm border-primary/20 hover:border-primary/40 transition-colors flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold text-gray-900 line-clamp-1" title={job.title}>{job.title}</h4>
                              <Badge className="bg-primary/10 text-primary border-transparent">{rec.score}% Match</Badge>
                            </div>
                            <p className="text-sm text-gray-600 flex items-center gap-1 mb-2">
                              <Building2 className="h-3 w-3" /> {(job as unknown as { poster?: { name?: string }; company?: string }).poster?.name || job.company || "Empresa"}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mb-4">
                              <MapPin className="h-3 w-3" /> {job.location || "Remoto"} • {job.modality || "N/A"}
                            </p>
                            <p className="text-xs text-gray-600 line-clamp-2">{rec.reason}</p>
                          </div>
                          <Button size="sm" className="w-full rounded-full shadow-none bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                            <Link to={`/vacantes/${job.id}`}>Ver vacante</Link>
                          </Button>
                        </Card>
                        ))}
                      </div>
                    ) : (
                      <Card className="bg-white rounded-2xl p-5 shadow-sm border-border">
                        <p className="text-sm text-gray-700">
                          Aún no hay vacantes con match alto (70%+) para tu perfil. Completa skills y experiencia para mejorar recomendaciones.
                        </p>
                      </Card>
                    )}
                  </div>
                )}

                {/* 2. POSTULACIONES RECIENTES */}
                {user.role !== "empresa" && (
                  <div className="space-y-4">
                    <h3 className="font-display text-xl font-bold flex items-center gap-2 text-gray-900">
                      <Briefcase className="h-6 w-6 text-blue-500" />
                      Tus Postulaciones
                    </h3>
                    <Card className="bg-white rounded-2xl shadow-sm border-border overflow-hidden">
                      {applications.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                          {applications.slice(0,3).map((app: ApplicationItem) => (
                            <div key={app.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                              <div>
                                <h4 className="font-semibold text-sm text-gray-900">{app.job?.title || "Vacante Aplicada"}</h4>
                                <p className="text-xs text-gray-500">{app.job?.poster?.name || "Empresa"}</p>
                              </div>
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                {app.status || "En revisión"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center flex flex-col items-center">
                          <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                            <Briefcase className="h-6 w-6 text-gray-400" />
                          </div>
                          <h4 className="text-sm font-semibold text-gray-900">No hay postulaciones recientes</h4>
                          <p className="text-xs text-gray-500 mt-1 max-w-[250px] mx-auto">Cuando apliques a una vacante, podrás hacerle seguimiento aquí.</p>
                        </div>
                      )}
                    </Card>
                  </div>
                )}

                {/* 3. COMUNIDAD Y FEED */}
                <div className="space-y-4 pt-6 mt-6 border-t border-border">
                  <h3 className="font-display text-xl font-bold flex items-center gap-2 text-gray-900 mb-4">
                    <Users className="h-6 w-6 text-purple-500" />
                    Comunidad Joblify
                  </h3>

                  {/* Crear post */}
                  <Card className="bg-white rounded-2xl p-4 shadow-sm mb-6">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center font-bold text-gray-500 overflow-hidden relative">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{user.name?.[0]?.toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1 space-y-3">
                        <Textarea 
                          placeholder="Comparte una actualización, artículo o un logro profesional..." 
                          className="min-h-[80px] bg-gray-50 border-transparent resize-none focus-visible:ring-1 focus-visible:bg-white text-sm"
                          value={newPostContent}
                          onChange={(e) => setNewPostContent(e.target.value)}
                        />
                        {(showLocationInput || showTagPicker) && (
                          <div className="space-y-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                            {showLocationInput && (
                              <div>
                                <label htmlFor="post-location" className="text-[11px] font-medium text-gray-600">Ubicación del post</label>
                                <input
                                  id="post-location"
                                  value={newPostLocation}
                                  onChange={(e) => setNewPostLocation(e.target.value)}
                                  placeholder="Ej: Bogotá, Colombia"
                                  className="mt-1 w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                            )}

                            {showTagPicker && (
                              <div>
                                <p className="text-[11px] font-medium text-gray-600 mb-1.5">Tipo de publicación</p>
                                <div className="flex flex-wrap gap-2">
                                  {POST_TAG_OPTIONS.map((option) => (
                                    <button
                                      key={option}
                                      type="button"
                                      onClick={() => setNewPostTag((current) => (current === option ? "" : option))}
                                      className={`h-7 px-3 rounded-full text-xs transition-colors ${
                                        newPostTag === option
                                          ? "bg-purple-100 text-purple-700 border border-purple-200"
                                          : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                                      }`}
                                    >
                                      {option}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setShowLocationInput((value) => !value)}
                              className={`h-8 w-8 transition-colors ${showLocationInput ? "text-blue-700 bg-blue-100 hover:bg-blue-100" : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"}`}
                              aria-label="Agregar ubicación"
                              title="Agregar ubicación"
                            >
                              <MapPin className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setShowTagPicker((value) => !value)}
                              className={`h-8 w-8 transition-colors ${showTagPicker ? "text-purple-700 bg-purple-100 hover:bg-purple-100" : "text-gray-500 hover:text-purple-600 hover:bg-purple-50"}`}
                              aria-label="Tipo de publicación"
                              title="Tipo de publicación"
                            >
                              <Briefcase className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button 
                            className="rounded-full h-8 px-4 text-xs" 
                            onClick={handlePost}
                            disabled={!newPostContent.trim() || createPost.isPending}
                          >
                            {createPost.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Send className="h-3 w-3 mr-1" />}
                            Publicar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Posts del feed */}
                  <div className="space-y-4">
                    {posts.map((post) => {
                      return (
                        <DashboardPostCard
                          key={post.id}
                          post={post}
                          onLike={(postId) => toggleLike.mutate(postId)}
                          isSaved={savedPostIds.has(post.id)}
                          onToggleSave={(postId) => toggleSavedPost.mutate(postId)}
                        />
                      );
                    })}

                    {posts.length === 0 && (
                      <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-border">
                        <Zap className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                        <h3 className="font-semibold text-gray-900">La comunidad está tranquila</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          ¡Sé el primero en compartir algo interesante hoy!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ─── COLUMNA DERECHA: Recomendaciones ──────────────── */}
          <div className="lg:col-span-3 space-y-6">
            {/* Próximos pasos */}
            <Card className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Próximos pasos</h3>
              <div className="space-y-3">
                {profileCompletion < 100 && (
                  <Link to="/perfil" className="flex gap-3 p-3 bg-blue-50/50 hover:bg-blue-50 rounded-xl transition-colors border border-blue-100/50 cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Completa tu perfil</p>
                      <p className="text-xs text-gray-500">Gana 2x más visibilidad</p>
                    </div>
                  </Link>
                )}
                
                <div className="flex gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-gray-100">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Simulador de Entrevista</p>
                    <p className="text-xs text-gray-500">Practica con nuestra IA</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Tendencias del mercado */}
            <Card className="bg-white rounded-2xl p-4 shadow-sm border-border">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Mercado Tech
              </h3>
              <div className="space-y-4">
                {[
                  { tag: "React Developer", salary: "$2,500 - $4,500" },
                  { tag: "Product Designer", salary: "$2,000 - $4,000" },
                  { tag: "Backend (Node)", salary: "$3,000 - $5,500" },
                  { tag: "Data Scientist", salary: "$2,800 - $5,000" },
                ].map((trend) => (
                  <div key={trend.tag} className="flex justify-between items-center group cursor-pointer">
                    <span className="text-sm font-medium text-gray-700 group-hover:text-primary transition-colors">{trend.tag}</span>
                    <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md">{trend.salary}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Footer */}
            <div className="text-xs text-gray-400 text-center flex flex-col gap-1">
              <p>Joblify 2026</p>
              <div className="flex justify-center gap-3">
                <span className="cursor-pointer hover:text-gray-600">Privacidad</span>
                <span className="cursor-pointer hover:text-gray-600">Términos</span>
                <span className="cursor-pointer hover:text-gray-600">Soporte</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HomeFeed;
