import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell, MessageSquare, Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { homeForRole, useAuthStore } from "@/store/authStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/lib/api";
import { hasRealSession } from "@/lib/session";
import { toast } from "sonner";

type NotificationItem = {
  id: string;
  type?: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  metadata?: {
    conversationId?: string;
    followerId?: string;
  };
};

type NotificationsResponse = {
  notifications: NotificationItem[];
  unreadCount: number;
};

export const Navbar = () => {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { user: session, token, refreshToken, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const isAuthenticated = hasRealSession(session, token, refreshToken);
  const isAppRoute = pathname.startsWith("/app");
  const isApp = isAuthenticated && isAppRoute;
  const appBase = session?.role ? homeForRole(session.role) : "/app/talento";

  const { data: notificationsData } = useQuery<NotificationsResponse>({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.list().then((res) => res.data),
    enabled: isApp,
    refetchInterval: isApp ? 30000 : false,
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.readAll(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const notifications = notificationsData?.notifications || [];
  const unreadCount = notificationsData?.unreadCount || 0;
  const messageNotifications = notifications.filter(
    (notification) =>
      notification.type === "MESSAGE" ||
      notification.type === "MESSAGE_REQUEST" ||
      notification.type === "MESSAGE_REQUEST_ACCEPTED" ||
      notification.type === "MESSAGE_REQUEST_REJECTED"
  );
  const unreadMessagesCount = messageNotifications.filter((notification) => !notification.isRead).length;

  const getNotificationLink = (notification: NotificationItem) => {
    if (notification.type === "FOLLOW" && notification.metadata?.followerId) {
      return `${appBase}/perfil/${notification.metadata.followerId}`;
    }
    if (
      notification.type === "MESSAGE" ||
      notification.type === "MESSAGE_REQUEST" ||
      notification.type === "MESSAGE_REQUEST_ACCEPTED" ||
      notification.type === "MESSAGE_REQUEST_REJECTED"
    ) {
      return `${appBase}/mensajes`;
    }
    return appBase;
  };

  useEffect(() => {
    setMessagesOpen(false);
    setNotificationsOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    queryClient.clear();
    setOpen(false);
    setMessagesOpen(false);
    setNotificationsOpen(false);
    toast.success("Sesión cerrada");
  };

  const appNavLinks = session ? (
    session.role === "candidato"
      ? [
          { to: appBase, label: "Inicio" },
          { to: `${appBase}/panel`, label: "Mi Panel" },
          { to: `${appBase}/vacantes`, label: "Vacantes" },
          { to: `${appBase}/aplicaciones`, label: "Aplicaciones" },
          { to: `${appBase}/guardados`, label: "Guardados" },
          { to: `${appBase}/mensajes`, label: "Mensajes" },
          { to: `${appBase}/perfil`, label: "Mi perfil" },
        ]
      : session.role === "empresa"
      ? [
          { to: appBase, label: "Inicio" },
          { to: `${appBase}/feed`, label: "Feed social" },
          { to: `${appBase}/vacantes`, label: "Vacantes" },
          { to: `${appBase}/candidatos`, label: "Candidatos" },
          { to: `${appBase}/pipeline`, label: "Pipeline" },
          { to: `${appBase}/mensajes`, label: "Mensajes" },
        ]
      : session.role === "freelancer"
      ? [
          { to: appBase, label: "Inicio" },
          { to: `${appBase}/feed`, label: "Feed social" },
          { to: `${appBase}/proyectos`, label: "Proyectos" },
          { to: `${appBase}/propuestas`, label: "Propuestas" },
          { to: `${appBase}/mensajes`, label: "Mensajes" },
        ]
      : session.role === "emprendedor"
      ? [
          { to: appBase, label: "Inicio" },
          { to: `${appBase}/feed`, label: "Feed social" },
          { to: `${appBase}/proyectos`, label: "Mis proyectos" },
          { to: `${appBase}/cofounders`, label: "Cofundadores" },
          { to: `${appBase}/postulantes`, label: "Postulantes" },
          { to: `${appBase}/mensajes`, label: "Mensajes" },
        ]
      : [
          { to: appBase, label: "Inicio" },
          { to: `${appBase}/feed`, label: "Feed social" },
          { to: `${appBase}/practicas`, label: "Prácticas" },
          { to: `${appBase}/recursos`, label: "Recursos" },
          { to: `${appBase}/aplicaciones`, label: "Aplicaciones" },
        ]
  ) : [];

  const navLinks = [
    { to: "/vacantes", label: "Vacantes" },
    { to: "/freelancers", label: "Freelancers" },
    { to: "/comunidad", label: "Comunidad" },
    { to: "/empresa", label: "Para empresas" },
  ];

  return (
    <header className="sticky top-0 z-40 h-20 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="h-full w-full max-w-[1920px] mx-auto px-6 lg:px-12 xl:px-16 flex items-center gap-10">
        <Link to="/" className="shrink-0" aria-label="Joblify - Inicio">
          <Logo size="lg" variant="dark" />
        </Link>

        <nav className="hidden lg:flex items-center gap-7 text-sm font-subtitle font-medium text-muted-foreground">
          {!isApp && navLinks.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={cn("hover:text-foreground transition-colors whitespace-nowrap", pathname === l.to && "text-foreground")}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 ml-auto">
          {isApp ? (
            <>
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Mensajes"
                  onClick={() => {
                    setMessagesOpen((current) => !current);
                    setNotificationsOpen(false);
                  }}
                >
                  <MessageSquare className="h-5 w-5" />
                  {unreadMessagesCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold leading-4">
                      {unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
                    </span>
                  )}
                </Button>

                {messagesOpen && (
                  <div className="absolute right-0 top-11 w-80 max-w-[90vw] rounded-2xl border border-border bg-background shadow-lg p-2 z-50">
                    <div className="flex items-center justify-between px-2 py-1.5">
                      <p className="text-xs font-subtitle font-semibold">Mensajes</p>
                      <Link
                        to={`${appBase}/mensajes`}
                        onClick={() => setMessagesOpen(false)}
                        className="text-[11px] text-primary hover:underline"
                      >
                        Ver todos
                      </Link>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {messageNotifications.length === 0 ? (
                        <p className="text-xs text-muted-foreground px-2 py-6 text-center">No tienes mensajes nuevos.</p>
                      ) : (
                        messageNotifications.slice(0, 6).map((notification) => (
                          <Link
                            key={notification.id}
                            to={getNotificationLink(notification)}
                            onClick={() => setMessagesOpen(false)}
                            className={cn(
                              "block rounded-xl px-2.5 py-2 hover:bg-surface-elevated transition-colors",
                              !notification.isRead && "bg-primary/5",
                              notification.type === "MESSAGE_REQUEST" && "border border-amber-400/40 bg-amber-500/10"
                            )}
                          >
                            <p className="text-xs font-subtitle font-semibold text-foreground line-clamp-1">{notification.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{notification.body}</p>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Notificaciones"
                  onClick={() => {
                    setNotificationsOpen((current) => !current);
                    setMessagesOpen(false);
                  }}
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold leading-4">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>

                {notificationsOpen && (
                  <div className="absolute right-0 top-11 w-80 max-w-[90vw] rounded-2xl border border-border bg-background shadow-lg p-2 z-50">
                    <div className="flex items-center justify-between px-2 py-1.5">
                      <p className="text-xs font-subtitle font-semibold">Notificaciones</p>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAllRead.mutate()}
                          className="text-[11px] text-primary hover:underline disabled:opacity-60"
                          disabled={markAllRead.isPending}
                        >
                          Marcar todas
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-muted-foreground px-2 py-6 text-center">No tienes notificaciones.</p>
                      ) : (
                        notifications.slice(0, 8).map((notification) => (
                          <Link
                            key={notification.id}
                            to={getNotificationLink(notification)}
                            className={cn(
                              "block rounded-xl px-2.5 py-2 hover:bg-surface-elevated transition-colors",
                              !notification.isRead && "bg-primary/5",
                              notification.type === "MESSAGE_REQUEST" && "border border-amber-400/40 bg-amber-500/10"
                            )}
                          >
                            <p className="text-xs font-subtitle font-semibold text-foreground line-clamp-1">{notification.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{notification.body}</p>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <Link to={appBase} className="ml-1 h-9 w-9 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-semibold overflow-hidden relative">
                {session?.avatarUrl ? (
                  <img src={session.avatarUrl} alt={session.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{session ? session.name.slice(0,2).toUpperCase() : "AC"}</span>
                )}
              </Link>
            </>
          ) : isAuthenticated ? (
            <>
              <Button variant="ghost" asChild className="hidden sm:inline-flex font-subtitle font-medium">
                <Link to={appBase}>Ir a mi panel</Link>
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="hidden sm:inline-flex rounded-xl px-5 h-11 font-subtitle font-semibold"
              >
                Cerrar sesión
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild className="hidden sm:inline-flex font-subtitle font-medium">
                <Link to="/login">Iniciar sesión</Link>
              </Button>
              <Button asChild className="hidden sm:inline-flex bg-foreground text-background hover:bg-foreground/90 rounded-xl px-5 h-11 font-subtitle font-semibold">
                <Link to="/register/elegir">Registrarse</Link>
              </Button>
            </>
          )}

          <button
            onClick={() => setOpen(o => !o)}
            className="lg:hidden h-10 w-10 inline-flex items-center justify-center rounded-lg hover:bg-surface-elevated"
            aria-label="Abrir menú"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t border-border bg-background animate-fade-in">
          <nav className="px-6 py-5 flex flex-col gap-1">
            {isApp ? appNavLinks.map(l => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="px-3 py-3 rounded-lg text-sm font-subtitle font-medium hover:bg-surface-elevated"
              >
                {l.label}
              </Link>
            )) : navLinks.map(l => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="px-3 py-3 rounded-lg text-sm font-subtitle font-medium hover:bg-surface-elevated"
              >
                {l.label}
              </Link>
            ))}

            {!isAuthenticated ? (
              <div className="mt-3 pt-4 border-t border-border flex flex-col gap-2">
                <Button asChild variant="outline" className="rounded-xl h-11 font-subtitle">
                  <Link to="/login" onClick={() => setOpen(false)}>Iniciar sesión</Link>
                </Button>
                <Button asChild className="rounded-xl h-11 bg-foreground text-background hover:bg-foreground/90 font-subtitle font-semibold">
                  <Link to="/register/elegir" onClick={() => setOpen(false)}>Registrarse</Link>
                </Button>
              </div>
            ) : isApp ? (
              <div className="mt-3 pt-4 border-t border-border">
                <Button asChild variant="outline" className="w-full rounded-xl h-11 font-subtitle">
                  <Link to={`${appBase}/configuracion`} onClick={() => setOpen(false)}>Configuración</Link>
                </Button>
              </div>
            ) : (
              <div className="mt-3 pt-4 border-t border-border flex flex-col gap-2">
                <Button asChild variant="outline" className="rounded-xl h-11 font-subtitle">
                  <Link to={appBase} onClick={() => setOpen(false)}>Ir a mi panel</Link>
                </Button>
                <Button onClick={handleLogout} className="rounded-xl h-11 bg-foreground text-background hover:bg-foreground/90 font-subtitle font-semibold">
                  Cerrar sesión
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
