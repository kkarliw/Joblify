import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Lock, CreditCard, Globe, User as UserIcon, Save } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { authApi, userApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Field = ({
  label,
  value,
  type = "text",
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  type?: string;
  onChange?: (next: string) => void;
  disabled?: boolean;
}) => (
  <div className="space-y-1.5">
    <label className="text-xs font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
    <input
      value={value}
      type={type}
      aria-label={label}
      title={label}
      placeholder={label}
      disabled={disabled}
      onChange={(e) => onChange?.(e.target.value)}
      className="w-full h-11 px-3 rounded-xl bg-surface-elevated border border-transparent focus:border-foreground focus:bg-card text-sm font-sans focus:outline-none disabled:opacity-60"
    />
  </div>
);

const Toggle = ({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) => (
  <label className="flex items-start justify-between gap-4 p-4 rounded-xl border border-border bg-card cursor-pointer hover:border-foreground transition-colors">
    <div>
      <p className="text-sm font-subtitle font-semibold">{label}</p>
      <p className="text-xs text-muted-foreground font-sans mt-0.5">{hint}</p>
    </div>
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-1 h-5 w-5 accent-primary"
    />
  </label>
);

type NotificationSettings = {
  opportunities: boolean;
  messages: boolean;
  weekly: boolean;
  aiRecommendations: boolean;
};

type SettingsPayload = {
  notifications: NotificationSettings;
  security: { twoFactorEnabled: boolean };
  language: string;
};

const defaultSettings: SettingsPayload = {
  notifications: {
    opportunities: true,
    messages: true,
    weekly: false,
    aiRecommendations: true,
  },
  security: { twoFactorEnabled: false },
  language: "es-LATAM",
};

const toObject = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
};

const parseAppSettings = (profileData: unknown): SettingsPayload => {
  const root = toObject(profileData);
  const appSettings = toObject(root.appSettings);

  const notifications = toObject(appSettings.notifications);
  const security = toObject(appSettings.security);

  return {
    notifications: {
      opportunities: typeof notifications.opportunities === "boolean" ? notifications.opportunities : defaultSettings.notifications.opportunities,
      messages: typeof notifications.messages === "boolean" ? notifications.messages : defaultSettings.notifications.messages,
      weekly: typeof notifications.weekly === "boolean" ? notifications.weekly : defaultSettings.notifications.weekly,
      aiRecommendations:
        typeof notifications.aiRecommendations === "boolean"
          ? notifications.aiRecommendations
          : defaultSettings.notifications.aiRecommendations,
    },
    security: {
      twoFactorEnabled:
        typeof security.twoFactorEnabled === "boolean" ? security.twoFactorEnabled : defaultSettings.security.twoFactorEnabled,
    },
    language: typeof appSettings.language === "string" ? appSettings.language : defaultSettings.language,
  };
};

const SettingsPage = () => {
  const queryClient = useQueryClient();
  const { user: session, setUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const isEmpresa = session?.role === "empresa";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [settings, setSettings] = useState<SettingsPayload>(defaultSettings);

  const { data: me, isLoading } = useQuery({
    queryKey: ["users", "me", "settings"],
    queryFn: () => userApi.me().then((res) => res.data),
  });

  useEffect(() => {
    if (!me) return;
    setName(me.name || "");
    setEmail(me.email || "");
    setPhone(me.phone || "");
    setLocation(me.location || "");
    setSettings(parseAppSettings(me.profileData));
  }, [me]);

  const currentPlanLabel = useMemo(() => {
    const plan = (me?.plan || session?.plan || "FREE").toString().toUpperCase();
    if (plan === "STARTER") return "Starter";
    if (plan === "GROWTH") return "Growth";
    if (plan === "ENTERPRISE") return "Enterprise";
    return "Free";
  }, [me?.plan, session?.plan]);

  const saveProfileMutation = useMutation({
    mutationFn: () => userApi.updateMe({ name: name.trim(), phone: phone.trim(), location: location.trim() }),
    onSuccess: (res) => {
      const updated = res.data;
      setUser({
        name: updated.name,
        location: updated.location,
      });
      queryClient.invalidateQueries({ queryKey: ["users", "me", "settings"] });
      toast.success("Datos personales actualizados");
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || "No se pudieron guardar los datos";
      toast.error(message);
    },
  });

  const savePreferencesMutation = useMutation({
    mutationFn: () => {
      const profileData = toObject(me?.profileData);
      const nextProfileData = {
        ...profileData,
        appSettings: {
          ...toObject(profileData.appSettings),
          notifications: settings.notifications,
          security: settings.security,
          language: settings.language,
        },
      };

      return userApi.updateMe({ profileData: nextProfileData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "me", "settings"] });
      toast.success("Preferencias guardadas");
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || "No se pudieron guardar las preferencias";
      toast.error(message);
    },
  });

  const requestPasswordResetMutation = useMutation({
    mutationFn: () => authApi.forgotPassword(email.trim()),
    onSuccess: () => {
      toast.success("Te enviamos un correo para cambiar contraseña");
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || "No se pudo enviar el correo de recuperación";
      toast.error(message);
    },
  });

  const handleLogout = async () => {
    await logout();
    queryClient.clear();
    navigate("/login", { replace: true });
    toast.success("Sesión cerrada");
  };

  return (
    <div>
      <PageHeader
        eyebrow="Configuración"
        title="Ajustes de cuenta"
        subtitle={isEmpresa ? "Datos personales, notificaciones, seguridad y facturación." : "Datos personales, notificaciones y seguridad de tu cuenta."}
      />

      <div className="space-y-6">
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <UserIcon className="h-4 w-4 text-primary" />
            <h2 className="font-subtitle font-semibold">Datos personales</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Nombre" value={name} onChange={setName} />
            <Field label="Email" value={email} type="email" disabled />
            <Field label="Teléfono" value={phone} onChange={setPhone} />
            <Field label="Ubicación" value={location} onChange={setLocation} />
          </div>
          <button
            type="button"
            disabled={isLoading || saveProfileMutation.isPending}
            onClick={() => saveProfileMutation.mutate()}
            className="mt-5 inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-foreground text-background text-sm font-subtitle font-semibold hover:bg-foreground/90 disabled:opacity-60"
          >
            <Save className="h-4 w-4" /> Guardar cambios
          </button>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-4 w-4 text-primary" />
            <h2 className="font-subtitle font-semibold">Notificaciones</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <Toggle
              label="Nuevas oportunidades"
              hint="Recibe un email cuando aparezca un match alto."
              checked={settings.notifications.opportunities}
              onChange={(next) =>
                setSettings((prev) => ({ ...prev, notifications: { ...prev.notifications, opportunities: next } }))
              }
            />
            <Toggle
              label="Mensajes"
              hint="Notificación push para mensajes nuevos."
              checked={settings.notifications.messages}
              onChange={(next) => setSettings((prev) => ({ ...prev, notifications: { ...prev.notifications, messages: next } }))}
            />
            <Toggle
              label="Resumen semanal"
              hint="Métricas y novedades cada lunes."
              checked={settings.notifications.weekly}
              onChange={(next) => setSettings((prev) => ({ ...prev, notifications: { ...prev.notifications, weekly: next } }))}
            />
            <Toggle
              label="Recomendaciones IA"
              hint="Sugerencias del motor de matching."
              checked={settings.notifications.aiRecommendations}
              onChange={(next) =>
                setSettings((prev) => ({ ...prev, notifications: { ...prev.notifications, aiRecommendations: next } }))
              }
            />
          </div>
          <button
            type="button"
            disabled={savePreferencesMutation.isPending}
            onClick={() => savePreferencesMutation.mutate()}
            className="mt-5 inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-foreground text-background text-sm font-subtitle font-semibold hover:bg-foreground/90 disabled:opacity-60"
          >
            <Save className="h-4 w-4" /> Guardar preferencias
          </button>
        </section>

        <div className="grid md:grid-cols-2 gap-6">
          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="h-4 w-4 text-primary" />
              <h2 className="font-subtitle font-semibold">Seguridad</h2>
            </div>
            <div className="space-y-4">
              <Toggle
                label="2FA"
                hint="Activar autenticación en dos pasos (preferencia guardada en tu perfil)."
                checked={settings.security.twoFactorEnabled}
                onChange={(next) => setSettings((prev) => ({ ...prev, security: { twoFactorEnabled: next } }))}
              />
              <button
                type="button"
                disabled={requestPasswordResetMutation.isPending || !email.trim()}
                onClick={() => requestPasswordResetMutation.mutate()}
                className="h-10 px-4 rounded-xl border border-border text-sm font-subtitle font-semibold hover:border-foreground disabled:opacity-60"
              >
                Cambiar contraseña por correo
              </button>
            </div>
          </section>
          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-4 w-4 text-primary" />
              <h2 className="font-subtitle font-semibold">{isEmpresa ? "Facturación" : "Cuenta"}</h2>
            </div>
            {isEmpresa ? (
              <>
                <p className="text-sm font-sans text-muted-foreground">Plan actual: <span className="font-subtitle font-semibold text-foreground">{currentPlanLabel}</span></p>
                <p className="text-xs text-muted-foreground mt-1 font-sans">La gestión de suscripción estará disponible cuando integremos Stripe Connect en esta vista.</p>
                <button
                  type="button"
                  onClick={() => toast.info("Próximamente: gestión de suscripción")}
                  className="mt-4 w-full h-10 rounded-xl border border-border text-sm font-subtitle font-semibold hover:border-foreground"
                >
                  Gestionar suscripción
                </button>
              </>
            ) : (
              <p className="text-sm font-sans text-muted-foreground">Configura idioma y preferencias generales de tu cuenta.</p>
            )}
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground font-sans">
              <Globe className="h-3 w-3" />
              <select
                value={settings.language}
                onChange={(e) => setSettings((prev) => ({ ...prev, language: e.target.value }))}
                className="h-8 rounded-lg border border-border px-2 text-xs bg-card"
                aria-label="Idioma"
              >
                <option value="es-LATAM">Español (LATAM)</option>
                <option value="es-ES">Español (España)</option>
                <option value="en-US">Inglés (US)</option>
              </select>
            </div>
          </section>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full h-11 rounded-xl border border-destructive/30 text-destructive text-sm font-subtitle font-semibold hover:bg-destructive/5"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
