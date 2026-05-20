import { useEffect, useMemo, useState } from "react";
import { Send, Phone, Video, Search, ArrowLeft, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { aiApi, messagesApi } from "@/lib/api";
import { userApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { LoginRequiredDialog } from "@/components/LoginRequiredDialog";
import { hasRealSession } from "@/lib/session";

type ConversationRequestStatus = "OPEN" | "PENDING" | "REJECTED";

type ConversationItem = {
  id: string;
  contact?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    headline?: string | null;
    role?: string | null;
  };
  lastMessage?: {
    id: string;
    content: string;
    createdAt: string;
    receiverId: string;
    isRead: boolean;
  } | null;
  updatedAt: string;
  requestStatus: ConversationRequestStatus;
  requesterId?: string | null;
  pendingApprovalForMe?: boolean;
  remainingTrialMessages?: number | null;
};

type ConversationMessage = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  conversationId?: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
};

type ContactItem = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  headline?: string | null;
  role?: string | null;
  conversationId?: string | null;
  isFollowing?: boolean;
};

type ApiError = {
  response?: {
    data?: {
      error?: string;
    };
  };
};

const formatShortDate = (value: string) => {
  const date = new Date(value);
  return date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });
};

const formatTime = (value: string) => {
  const date = new Date(value);
  return date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
};

const MessagesPage = () => {
  const { user, token, refreshToken } = useAuthStore();
  const queryClient = useQueryClient();
  const [active, setActive] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [showChatMobile, setShowChatMobile] = useState(false);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [contactQuery, setContactQuery] = useState("");
  const [pendingContact, setPendingContact] = useState<ContactItem | null>(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [loginTarget, setLoginTarget] = useState("/login");
  const [suggestingDraft, setSuggestingDraft] = useState(false);

  const isAuthenticated = hasRealSession(user, token, refreshToken);

  const requestLogin = (message: string) => {
    setLoginTarget(`/login?next=${encodeURIComponent(window.location.pathname)}`);
    setAuthDialogOpen(true);
    toast.info(message);
  };

  const { data: conversations = [], isLoading: loadingConversations } = useQuery<ConversationItem[]>({
    queryKey: ["messages", "conversations"],
    queryFn: () => messagesApi.conversations().then((res) => res.data),
    enabled: isAuthenticated,
  });

  const toggleFollowMutation = useMutation({
    mutationFn: (userId: string) => {
      if (!isAuthenticated) {
        throw new Error("AUTH_REQUIRED");
      }
      return userApi.toggleFollow(userId);
    },
    onSuccess: (_res, userId) => {
      queryClient.invalidateQueries({ queryKey: ["messages", "contacts"] });
      queryClient.invalidateQueries({ queryKey: ["messages", "conversations"] });
      toast.success("Estado de seguimiento actualizado");
    },
    onError: (error: unknown) => {
      if (error instanceof Error && error.message === "AUTH_REQUIRED") {
        requestLogin("Inicia sesión para seguir usuarios");
        return;
      }
      toast.error("No se pudo actualizar el seguimiento");
    },
  });

  const filteredConversations = useMemo(
    () => conversations.filter((conversation) =>
      conversation.contact?.name?.toLowerCase().includes(search.toLowerCase())
    ),
    [conversations, search]
  );

  const { data: contacts = [], isLoading: loadingContacts } = useQuery<ContactItem[]>({
    queryKey: ["messages", "contacts", contactQuery],
    queryFn: async () => {
      if (contactQuery.trim().length >= 2) {
        const res = await userApi.search(contactQuery.trim(), undefined, 1, 20);
        return res.data.data.map((u: {
          id: string;
          name: string;
          avatarUrl?: string | null;
          headline?: string | null;
          role?: string;
          isFollowing?: boolean;
        }) => ({
          id: u.id,
          name: u.name,
          avatarUrl: u.avatarUrl,
          headline: u.headline,
          role: u.role,
          conversationId: null,
          isFollowing: u.isFollowing,
        }));
      }
      return messagesApi.contacts(contactQuery).then((res) => res.data);
    },
    enabled: isAuthenticated && creating,
  });

  useEffect(() => {
    if (pendingContact) return;

    if (!active && conversations.length > 0) {
      setActive(conversations[0].id);
      return;
    }
    if (active && !conversations.some((conversation) => conversation.id === active)) {
      setActive(conversations[0]?.id || null);
    }
  }, [active, conversations, pendingContact]);

  const conv = conversations.find((conversation) => conversation.id === active) || null;
  const chatContact = conv?.contact || pendingContact;
  const requiresDecision = Boolean(active && conv?.pendingApprovalForMe);

  const { data: msgs = [], isLoading: loadingMessages } = useQuery<ConversationMessage[]>({
    queryKey: ["messages", "conversation", active],
    queryFn: () => messagesApi.getConversation(active as string).then((res) => res.data),
    enabled: isAuthenticated && !!active,
  });

  const respondRequestMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "accept" | "reject" }) => {
      if (!isAuthenticated) {
        throw new Error("AUTH_REQUIRED");
      }
      return messagesApi.respondRequest(id, action);
    },
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ["messages", "conversations"] });
      queryClient.invalidateQueries({ queryKey: ["messages", "conversation", variables.id] });
      toast.success(variables.action === "accept" ? "Solicitud aceptada" : "Solicitud rechazada");
    },
    onError: (error: unknown) => {
      if (error instanceof Error && error.message === "AUTH_REQUIRED") {
        requestLogin("Inicia sesión para responder solicitudes");
        return;
      }
      const message = (error as ApiError)?.response?.data?.error || "No se pudo responder la solicitud";
      toast.error(message);
    },
  });

  const suggestMessageWithAi = async () => {
    if (!draft.trim()) {
      toast.info("Escribe un borrador para mejorarlo con IA");
      return;
    }

    setSuggestingDraft(true);
    try {
      const context = /entrevista|interview|preguntas/i.test(draft) ? "pre_interview" : "career_advice";
      const prompt = `Mejora este mensaje para enviarlo por chat profesional. Mantén tono humano, claro y breve en español LATAM. Devuelve solo el texto final:\n\n${draft}`;
      const res = await aiApi.chat(prompt, context);
      const reply = (res.data as { reply?: string }).reply?.trim();
      if (!reply) {
        toast.error("La IA no devolvió sugerencia");
        return;
      }
      setDraft(reply);
      toast.success("Mensaje optimizado con IA");
    } catch {
      toast.error("No se pudo generar sugerencia IA");
    } finally {
      setSuggestingDraft(false);
    }
  };

  const sendMutation = useMutation({
    mutationFn: async (payload: { receiverId: string; content: string; conversationId?: string }) => {
      if (!isAuthenticated) {
        throw new Error("AUTH_REQUIRED");
      }
      if (!payload.receiverId || !payload.content.trim()) {
        throw new Error("Missing message context");
      }

      const moderation = await aiApi.moderateContent(payload.content, "message");
      const moderationData = moderation.data as { allowed?: boolean; reason?: string; sanitizedText?: string };
      if (moderationData.allowed === false) {
        throw new Error(moderationData.reason || "El mensaje no pasó la moderación IA");
      }

      const finalContent = moderationData.sanitizedText?.trim() || payload.content.trim();
      return messagesApi.send(payload.receiverId, finalContent, payload.conversationId);
    },
    onSuccess: (res) => {
      setDraft("");
      queryClient.invalidateQueries({ queryKey: ["messages", "conversations"] });

      const newConversationId = res.data?.conversationId as string | undefined;
      const targetConversationId = active || newConversationId;

      if (targetConversationId) {
        setActive(targetConversationId);
        queryClient.invalidateQueries({ queryKey: ["messages", "conversation", targetConversationId] });
      }

      if (pendingContact) {
        setPendingContact(null);
      }

      setCreating(false);
      setShowChatMobile(true);
    },
    onError: (error: unknown) => {
      if (error instanceof Error && error.message === "AUTH_REQUIRED") {
        requestLogin("Inicia sesión para enviar mensajes");
        return;
      }
      const message = (error as ApiError)?.response?.data?.error || "No se pudo enviar el mensaje";
      toast.error(message);
    },
  });

  const startConversationWithContact = (contact: ContactItem) => {
    setCreating(false);
    setContactQuery("");
    setShowChatMobile(true);

    if (contact.conversationId) {
      setPendingContact(null);
      setActive(contact.conversationId);
    } else {
      setActive(null);
      setPendingContact(contact);
    }
  };

  const switchConv = (id: string) => {
    setActive(id);
    setShowChatMobile(true);
  };

  const send = () => {
    if (!isAuthenticated) {
      requestLogin("Inicia sesión para enviar mensajes");
      return;
    }

    if (!draft.trim()) return;

    if (active && conv?.contact?.id) {
      if (conv.requestStatus === "REJECTED") {
        toast.error("Esta conversación fue rechazada");
        return;
      }

      if (conv.pendingApprovalForMe) {
        toast.error("Debes aceptar o rechazar la solicitud antes de responder");
        return;
      }

      if (conv.requestStatus === "PENDING" && conv.requesterId === user?.id && (conv.remainingTrialMessages ?? 0) <= 0) {
        toast.error("Ya enviaste tus 3 mensajes. Espera respuesta de la otra persona.");
        return;
      }

      sendMutation.mutate({ receiverId: conv.contact.id, content: draft.trim(), conversationId: active });
      return;
    }

    if (pendingContact?.id) {
      sendMutation.mutate({ receiverId: pendingContact.id, content: draft.trim() });
      return;
    }

    if (!chatContact?.id) {
      toast.error("Selecciona una conversación para enviar mensajes");
      return;
    }

    sendMutation.mutate({ receiverId: chatContact.id, content: draft.trim() });
  };

  return (
    <div>
      <PageHeader eyebrow="Conversaciones" title="Mensajes" subtitle="Habla con candidatos, reclutadores o clientes desde un solo lugar." />
      <div className="grid lg:grid-cols-[300px_1fr] border border-border rounded-2xl overflow-hidden bg-card h-[calc(100dvh-220px)] min-h-[560px] max-h-[780px]">
        <aside className={cn("border-r border-border flex flex-col", showChatMobile ? "hidden lg:flex" : "flex")}>
          <div className="p-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 h-9 rounded-lg bg-surface-elevated flex-1">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="bg-transparent text-xs flex-1 focus:outline-none font-sans"
                />
              </div>
              <button
                onClick={() => setCreating((current) => !current)}
                className="h-9 px-3 rounded-lg bg-foreground text-background text-xs font-subtitle font-semibold"
              >
                Nueva
              </button>
            </div>

            {creating && (
              <div className="mt-2 rounded-xl border border-border p-2 bg-background">
                <div className="flex items-center gap-2 px-2 h-8 rounded-lg bg-surface-elevated">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    value={contactQuery}
                    onChange={(e) => setContactQuery(e.target.value)}
                    placeholder="Buscar contacto..."
                    className="bg-transparent text-xs flex-1 focus:outline-none font-sans"
                  />
                </div>
                <p className="mt-1 px-1 text-[10px] text-muted-foreground font-sans">
                  Tu red aparece por defecto. Escribe 2+ letras para buscar fuera de tu red y enviar solicitud.
                </p>

                <div className="mt-2 max-h-60 overflow-y-auto space-y-1">
                  {loadingContacts ? (
                    <div className="text-[11px] text-muted-foreground p-2 text-center">
                      <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto mb-1" />
                      Buscando contactos...
                    </div>
                  ) : contacts.length === 0 ? (
                    <div className="text-[11px] text-muted-foreground p-2 text-center">No se encontraron usuarios.</div>
                  ) : (
                    contacts.map((contact) => (
                      <div
                        key={contact.id}
                        onClick={() => startConversationWithContact(contact)}
                        className="w-full text-left rounded-lg px-2 py-2 hover:bg-surface-elevated transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          <div className="h-8 w-8 rounded-full bg-foreground text-background text-[11px] flex items-center justify-center font-semibold shrink-0 overflow-hidden">
                            {contact.avatarUrl ? (
                              <img src={contact.avatarUrl} alt={contact.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{contact.name?.slice(0, 2).toUpperCase() || "??"}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-subtitle font-semibold truncate">{contact.name}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{contact.headline || contact.role || "Usuario Joblify"}</p>
                            <div className="mt-1 flex items-center gap-2">
                              {typeof contact.isFollowing === "boolean" && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleFollowMutation.mutate(contact.id); }}
                                  disabled={toggleFollowMutation.isPending}
                                  className={cn(
                                    "text-[11px] px-2 py-1 rounded-md border disabled:opacity-60",
                                    contact.isFollowing
                                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700"
                                      : "border-border hover:bg-surface-elevated"
                                  )}
                                >
                                  {contact.isFollowing ? "Seguido" : "Seguir"}
                                </button>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); startConversationWithContact(contact); }}
                                className="text-[11px] px-2 py-1 rounded-md bg-foreground text-background hover:bg-foreground/90"
                              >
                                Contactar
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <ul className="flex-1 overflow-y-auto">
            {loadingConversations && (
              <li className="p-4 text-center text-muted-foreground text-xs">
                <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                Cargando conversaciones...
              </li>
            )}

            {!loadingConversations && filteredConversations.length === 0 && (
              <li className="p-4 text-center text-muted-foreground text-xs">No tienes conversaciones aún.</li>
            )}

            {filteredConversations.map((c) => {
              const unread = c.lastMessage && user
                ? Number(!c.lastMessage.isRead && c.lastMessage.receiverId === user.id)
                : 0;

              return (
              <li key={c.id}>
                <button
                  onClick={() => switchConv(c.id)}
                  className={cn("w-full text-left p-3 flex gap-3 hover:bg-surface-elevated/50 transition-colors", active === c.id && "bg-surface-elevated")}
                >
                  <div className="h-9 w-9 rounded-full bg-foreground text-background text-xs flex items-center justify-center font-semibold shrink-0 overflow-hidden">
                    {c.contact?.avatarUrl ? (
                      <img src={c.contact.avatarUrl} alt={c.contact.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{c.contact?.name?.slice(0, 2).toUpperCase() || "??"}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-subtitle font-semibold truncate">{c.contact?.name || "Usuario"}</p>
                      <span className="text-[10px] text-muted-foreground shrink-0">{formatShortDate(c.lastMessage?.createdAt || c.updatedAt)}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate font-sans">{c.lastMessage?.content || "Sin mensajes"}</p>
                    {c.requestStatus === "PENDING" && (
                      <p className="text-[10px] text-primary mt-0.5 font-sans">
                        {c.pendingApprovalForMe
                          ? "Solicitud pendiente · debes aceptar/rechazar"
                          : `Solicitud enviada · te quedan ${c.remainingTrialMessages ?? 0} mensajes`}
                      </p>
                    )}
                    {c.requestStatus === "REJECTED" && (
                      <p className="text-[10px] text-destructive mt-0.5 font-sans">Conversación rechazada</p>
                    )}
                  </div>
                  {unread > 0 && <span className="h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center shrink-0">{unread}</span>}
                </button>
              </li>
              );
            })}
          </ul>
        </aside>
        <section className={cn("flex flex-col min-w-0", !showChatMobile ? "hidden lg:flex" : "flex")}>
          {chatContact ? (
            <>
              <header className="h-14 border-b border-border flex items-center px-4 gap-3">
                <button
                  onClick={() => setShowChatMobile(false)}
                  className="h-8 w-8 rounded-lg hover:bg-surface-elevated flex items-center justify-center lg:hidden"
                  aria-label="Volver a conversaciones"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="h-9 w-9 rounded-full bg-foreground text-background text-xs flex items-center justify-center font-semibold overflow-hidden">
                  {chatContact.avatarUrl ? (
                    <img src={chatContact.avatarUrl} alt={chatContact.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{chatContact.name?.slice(0, 2).toUpperCase() || "??"}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-subtitle font-semibold truncate">{chatContact.name || "Usuario"}</p>
                  <p className="text-[11px] text-muted-foreground truncate font-sans">{chatContact.headline || chatContact.role || "Sin descripción"}</p>
                  {active && conv?.requestStatus === "PENDING" && (
                    <p className="text-[11px] text-primary mt-0.5 font-sans">
                      {conv.pendingApprovalForMe
                        ? "Esta persona te envió solicitud de conversación"
                        : `Solicitud pendiente · te quedan ${conv.remainingTrialMessages ?? 0} mensajes`}
                    </p>
                  )}
                  {active && conv?.requestStatus === "REJECTED" && (
                    <p className="text-[11px] text-destructive mt-0.5 font-sans">La conversación fue rechazada</p>
                  )}
                </div>
                {active && conv?.pendingApprovalForMe && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => respondRequestMutation.mutate({ id: active, action: "reject" })}
                      disabled={respondRequestMutation.isPending}
                      className="h-8 px-3 rounded-lg border border-border text-xs font-subtitle font-semibold hover:bg-surface-elevated disabled:opacity-60"
                    >
                      Rechazar
                    </button>
                    <button
                      onClick={() => respondRequestMutation.mutate({ id: active, action: "accept" })}
                      disabled={respondRequestMutation.isPending}
                      className="h-8 px-3 rounded-lg bg-foreground text-background text-xs font-subtitle font-semibold hover:bg-foreground/90 disabled:opacity-60"
                    >
                      Aceptar
                    </button>
                  </div>
                )}
                <button aria-label="Llamar" title="Llamar" className="h-8 w-8 rounded-lg hover:bg-surface-elevated flex items-center justify-center"><Phone className="h-4 w-4" /></button>
                <button aria-label="Videollamada" title="Videollamada" className="h-8 w-8 rounded-lg hover:bg-surface-elevated flex items-center justify-center"><Video className="h-4 w-4" /></button>
              </header>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {requiresDecision && (
                  <div className="rounded-xl border border-amber-400/50 bg-amber-500/10 px-3 py-2 text-xs font-sans text-amber-800">
                    Esta persona no está en tu red. Revisa el mensaje y decide si aceptas o rechazas la conversación.
                  </div>
                )}

                {active && loadingMessages ? (
                  <div className="text-center text-muted-foreground text-xs py-4">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                    Cargando mensajes...
                  </div>
                ) : active ? msgs.map((m) => {
                  const isMine = m.senderId === user?.id;
                  return (
                    <div key={m.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[75%] px-3 py-2 rounded-2xl text-sm font-sans",
                        isMine ? "bg-foreground text-background rounded-br-sm" : "bg-surface-elevated rounded-bl-sm"
                      )}>
                        {m.content}
                        <div className={cn("text-[10px] mt-0.5", isMine ? "text-background/60" : "text-muted-foreground")}>{formatTime(m.createdAt)}</div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center text-muted-foreground text-xs py-6">
                    Inicia la conversación enviando el primer mensaje.
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-border flex gap-2">
                <button
                  type="button"
                  onClick={suggestMessageWithAi}
                  disabled={suggestingDraft || !draft.trim()}
                  className="h-10 px-3 rounded-full border border-border text-xs font-subtitle font-semibold hover:bg-surface-elevated disabled:opacity-60"
                >
                  {suggestingDraft ? "IA..." : "Sugerir IA"}
                </button>
                <input
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && send()}
                  placeholder={requiresDecision ? "Acepta o rechaza la solicitud para responder" : "Escribe un mensaje…"}
                  className="flex-1 h-10 px-4 rounded-full bg-surface-elevated text-sm focus:outline-none font-sans"
                />
                <button
                  aria-label="Enviar mensaje"
                  title="Enviar mensaje"
                  onClick={send}
                  disabled={
                    sendMutation.isPending ||
                    (active
                      ? conv?.requestStatus === "REJECTED" ||
                        conv?.pendingApprovalForMe === true ||
                        (conv?.requestStatus === "PENDING" && conv?.requesterId === user?.id && (conv?.remainingTrialMessages ?? 0) <= 0)
                      : false)
                  }
                  className="h-10 w-10 rounded-full bg-foreground text-background flex items-center justify-center hover:bg-foreground/90 disabled:opacity-60"
                >
                  {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground p-6 text-center">
              No hay conversación seleccionada.
            </div>
          )}
        </section>
      </div>

      <LoginRequiredDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        description="Para usar mensajería y contactar usuarios, debes iniciar sesión."
        loginTo={loginTarget}
      />
    </div>
  );
};

export default MessagesPage;
