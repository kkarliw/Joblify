import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Briefcase, MapPin, Star, MessageSquare, Loader2, UserPlus, UserMinus, Share2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { userApi, api, messagesApi, feedApi } from "@/lib/api";
import { homeForRole, useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { RoleAppLayout } from "@/components/RoleAppLayout";
import { LoginRequiredDialog } from "@/components/LoginRequiredDialog";
import { hasRealSession } from "@/lib/session";

type PublicPost = {
  id: string;
  content: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
};

export const PublicProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token, refreshToken } = useAuthStore();
  const queryClient = useQueryClient();
  const [followFxActive, setFollowFxActive] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [loginTarget, setLoginTarget] = useState("/login");

  const isAuthenticated = hasRealSession(user, token, refreshToken);

  const requestLogin = (message: string) => {
    setLoginTarget(`/login?next=${encodeURIComponent(window.location.pathname)}`);
    setAuthDialogOpen(true);
    toast.info(message);
  };

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["profile", id],
    queryFn: () => userApi.getProfile(id as string).then(res => res.data),
    enabled: !!id,
    retry: false
  });

  const { data: followStatus } = useQuery({
    queryKey: ["follow", id],
    queryFn: () => api.get(`/users/${id}/follow-status`).then(res => res.data),
    enabled: !!id && !!user && id !== user.id,
  });

  const { data: userPosts, isLoading: postsLoading } = useQuery({
    queryKey: ["profile-posts", id],
    queryFn: () => feedApi.byUser(id as string).then(res => res.data),
    enabled: !!id,
  });

  const isFollowing = followStatus?.isFollowing;

  const toggleFollowMutation = useMutation({
    mutationFn: () => {
      if (!isAuthenticated) {
        throw new Error("AUTH_REQUIRED");
      }
      return api.post(`/users/${id}/follow`);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["follow", id] });
      queryClient.invalidateQueries({ queryKey: ["messages", "contacts"] });
      if (res.data.isFollowing) {
        setFollowFxActive(true);
        setTimeout(() => setFollowFxActive(false), 280);
      }
      toast.success(res.data.isFollowing ? "Ahora sigues a este usuario" : "Dejaste de seguir a este usuario");
    },
    onError: (err: unknown) => {
      if (err instanceof Error && err.message === "AUTH_REQUIRED") {
        requestLogin("Inicia sesión para seguir usuarios");
        return;
      }
      toast.error("Error al actualizar seguimiento");
    }
  });

  const createConversationMutation = useMutation({
    mutationFn: () => {
      if (!isAuthenticated) {
        throw new Error("AUTH_REQUIRED");
      }
      return messagesApi.send(id as string, "¡Hola! Me gustaría conectar contigo.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", "conversations"] });
      toast.success("Conversación iniciada");
      if (isAuthenticated && user?.role) {
        navigate(`${homeForRole(user.role)}/mensajes`);
      }
    },
    onError: (err: unknown) => {
      if (err instanceof Error && err.message === "AUTH_REQUIRED") {
        requestLogin("Inicia sesión para enviar mensajes");
        return;
      }
      const apiErr = err as { response?: { data?: { error?: string } } };
      const msg = apiErr.response?.data?.error || "Error al iniciar conversación";
      toast.error(msg);
    }
  });

  if (isLoading) {
    return <div className="p-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (error || !profile) {
    return <div className="p-12 text-center text-muted-foreground">Usuario no encontrado</div>;
  }

  const profileDataObj = typeof profile.profileData === 'string' ? JSON.parse(profile.profileData) : (profile.profileData || {});
  const skills = profileDataObj.skills || profile.skills?.map((s: { skill: { name: string } }) => s.skill.name) || [];

  const copyProfileLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link de perfil copiado");
    } catch {
      toast.error("No se pudo copiar el link");
    }
  };

  return (
    <div className="min-h-screen bg-white pb-12">
      <div className="max-w-5xl mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl border border-[#ececec] bg-white shadow-[0_14px_34px_rgba(0,0,0,0.05)] mt-6">
          <div className="h-32 bg-gradient-to-r from-white via-[#fff7db] to-white" />
          <div className="px-6 py-6 flex flex-col gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 gap-4 items-end">
                <div className="h-24 w-24 rounded-3xl bg-foreground text-background flex items-center justify-center text-xl font-display font-bold border-4 border-white shadow-[0_12px_30px_rgba(0,0,0,0.12)] overflow-hidden">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={profile.name || "Avatar"} className="w-full h-full object-cover" />
                  ) : (
                    (profile.name || "U").slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="pb-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h2 className="font-display text-2xl font-bold text-foreground leading-tight break-words">{profile.name}</h2>
                    {profile.isVerified && <span className="px-2 py-0.5 text-[11px] rounded-full bg-[#e6f2ff] text-[#0071E3] font-semibold">Verificado</span>}
                  </div>
                  <p className="text-sm text-[#6E6E73] font-sans leading-relaxed break-words">{profile.headline || profile.role}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#6E6E73] font-sans">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {profile.location || "Ubicación sin especificar"}</span>
                  </div>
                </div>
              </div>

              {isAuthenticated && user && user.id !== profile.id && (
                <div className="flex flex-wrap gap-2 items-center lg:justify-end">
                  <button
                    onClick={() => toggleFollowMutation.mutate()}
                    disabled={toggleFollowMutation.isPending}
                    className={`h-10 px-5 rounded-full text-sm font-subtitle font-semibold inline-flex items-center gap-2 disabled:opacity-50 transition-all ${
                      isFollowing
                        ? "bg-white text-[#1D1D1F] border border-[#d2d2d7]"
                        : "bg-white text-[#1D1D1F] border border-[#d2d2d7] hover:border-[#1D1D1F]"
                    } ${followFxActive ? "scale-[1.02]" : "scale-100"}`}
                  >
                    {toggleFollowMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isFollowing ? (
                      <><UserMinus className="h-4 w-4" /> Siguiendo</>
                    ) : (
                      <><UserPlus className="h-4 w-4" /> Seguir</>
                    )}
                  </button>
                  <button
                    onClick={() => createConversationMutation.mutate()}
                    disabled={createConversationMutation.isPending}
                    className="h-10 px-5 rounded-full bg-[#FFC300] text-[#1D1D1F] text-sm font-subtitle font-semibold hover:bg-[#ffb700] inline-flex items-center gap-2 disabled:opacity-50 shadow-sm"
                  >
                    {createConversationMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                    Contactar
                  </button>
                  <button
                    onClick={copyProfileLink}
                    className="h-10 px-4 rounded-full border border-[#d2d2d7] bg-white hover:border-[#1D1D1F] text-sm font-subtitle font-semibold inline-flex items-center gap-2 shadow-sm"
                  >
                    <Share2 className="h-4 w-4" /> Compartir
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[#ececec] bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
              <p className="text-sm font-sans text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {profile.bio || "Este usuario aún no ha agregado una biografía."}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid lg:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-6">
            {skills.length > 0 && (
              <section className="rounded-2xl border border-[#ececec] bg-white shadow-sm p-5">
                <h3 className="font-subtitle font-semibold mb-4 text-foreground">Habilidades destacadas</h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill: string, idx: number) => (
                    <span key={idx} className="px-3 py-1.5 bg-[#f5f5f7] border border-[#d2d2d7] rounded-full text-sm font-sans font-medium text-foreground">
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {profile.experience && profile.experience.length > 0 && (
              <section className="rounded-2xl border border-[#ececec] bg-white shadow-sm p-5">
                <h3 className="font-subtitle font-semibold mb-4 text-foreground">Experiencia</h3>
                <ul className="space-y-4">
                  {profile.experience.map((x: { id: string; title: string; company: string; startDate: string; endDate?: string; current: boolean }) => (
                    <li key={x.id} className="flex gap-3">
                      <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shrink-0 text-xs font-subtitle text-[#6E6E73] border border-[#d2d2d7]">{x.company?.[0]?.toUpperCase() || ""}</div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold text-foreground">{x.title}</p>
                        <p className="text-xs text-[#6E6E73] font-sans">{x.company}</p>
                        <p className="text-[11px] text-[#6E6E73] font-sans">
                          {new Date(x.startDate).getFullYear()} — {x.current ? "Hoy" : x.endDate ? new Date(x.endDate).getFullYear() : ""}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="rounded-2xl border border-[#ececec] bg-white shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-subtitle font-semibold text-foreground">Publicaciones</h3>
              </div>
              {postsLoading && (
                <div className="flex items-center gap-2 text-sm text-[#6E6E73]"><Loader2 className="h-4 w-4 animate-spin" /> Cargando posts…</div>
              )}
              {!postsLoading && userPosts && userPosts.length === 0 && (
                <p className="text-sm text-[#6E6E73]">Aún no hay publicaciones.</p>
              )}
              {!postsLoading && userPosts && userPosts.length > 0 && (
                <div className="space-y-4">
                  {userPosts.map((post: PublicPost) => (
                    <article key={post.id} className="border border-[#ececec] rounded-2xl p-4 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
                      <div className="flex items-center gap-2 text-xs text-[#6E6E73] mb-2">
                        <div className="h-8 w-8 rounded-full bg-white border border-[#d2d2d7] flex items-center justify-center text-[11px] font-semibold text-foreground">
                          {(profile.name || "U").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-subtitle text-foreground">{profile.name}</span>
                          <span>{new Date(post.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                      <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{post.content}</p>
                      <div className="mt-3 flex items-center justify-end gap-4 text-xs text-[#6E6E73]">
                        <span>{post.likesCount} me gusta</span>
                        <span>{post.commentsCount} comentarios</span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="space-y-4">
            {isAuthenticated && user && user.id !== profile.id && (
              <div className="rounded-2xl border border-[#ececec] bg-white shadow-sm p-5">
                <h3 className="font-subtitle font-semibold mb-3 text-foreground">Contacto rápido</h3>
                <p className="text-sm text-[#6E6E73] mb-4">Envía un mensaje directo o comparte su perfil.</p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => createConversationMutation.mutate()}
                    disabled={createConversationMutation.isPending}
                    className="h-10 px-5 rounded-full bg-[#FFC300] text-[#1D1D1F] text-sm font-subtitle font-semibold hover:bg-[#ffb700] inline-flex items-center gap-2 disabled:opacity-50 shadow-sm"
                  >
                    {createConversationMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                    Enviar mensaje
                  </button>
                  <button
                    onClick={copyProfileLink}
                    className="h-10 px-5 rounded-full border border-[#d2d2d7] text-sm font-subtitle font-semibold inline-flex items-center gap-2 hover:border-[#1D1D1F]"
                  >
                    <Share2 className="h-4 w-4" /> Copiar perfil
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <LoginRequiredDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        description="Para contactar o seguir perfiles, debes iniciar sesión con una cuenta activa."
        loginTo={loginTarget}
      />
    </div>
  );
};

export default PublicProfilePage;
