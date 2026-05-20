import { AppLayout } from "@/components/Layouts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const tabs = [
  { value: "cuenta", label: "Cuenta" },
  { value: "perfil", label: "Perfil" },
  { value: "notificaciones", label: "Notificaciones" },
  { value: "privacidad", label: "Privacidad" },
  { value: "seguridad", label: "Seguridad" },
  { value: "facturacion", label: "Facturación" },
];

const Toggle = ({ title, desc, defaultChecked }: { title: string; desc: string; defaultChecked?: boolean }) => (
  <div className="flex items-start justify-between py-5 border-b border-border last:border-0">
    <div className="pr-6">
      <div className="font-subtitle font-semibold text-sm">{title}</div>
      <div className="text-xs text-muted-foreground mt-1 font-sans">{desc}</div>
    </div>
    <Switch defaultChecked={defaultChecked} />
  </div>
);

const cardCls = "bg-white border border-border rounded-2xl p-7 max-w-2xl";
const inputCls = "h-12 bg-surface-elevated border-transparent rounded-xl";
const labelCls = "text-xs font-subtitle font-semibold uppercase tracking-wider";

const Configuracion = () => {
  return (
    <AppLayout>
      <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Configuración</h1>
      <p className="mt-2 text-muted-foreground font-sans">Gestiona tu cuenta, privacidad y preferencias.</p>

      <Tabs defaultValue="cuenta" className="mt-8">
        <TabsList className="bg-transparent p-0 h-auto border-b border-border w-full justify-start rounded-none gap-1 overflow-x-auto">
          {tabs.map(t => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:border-foreground rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-subtitle"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="cuenta" className="mt-8">
          <div className={cardCls}>
            <h2 className="font-display text-xl font-bold mb-5">Información personal</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label className={labelCls}>Nombre</Label><Input defaultValue="Andrea" className={inputCls} /></div>
              <div className="space-y-2"><Label className={labelCls}>Apellido</Label><Input defaultValue="Castillo" className={inputCls} /></div>
              <div className="space-y-2 sm:col-span-2"><Label className={labelCls}>Email</Label><Input defaultValue="andrea@joblify.com" className={inputCls} /></div>
            </div>
            <Button className="mt-6 h-12 px-6 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-subtitle font-semibold">Guardar cambios</Button>
          </div>
        </TabsContent>

        <TabsContent value="perfil" className="mt-8">
          <div className={cardCls + " space-y-5"}>
            <div className="space-y-2"><Label className={labelCls}>Título profesional</Label><Input defaultValue="Senior Product Designer" className={inputCls} /></div>
            <div className="space-y-2"><Label className={labelCls}>Ubicación</Label><Input defaultValue="Ciudad de México" className={inputCls} /></div>
            <div className="space-y-2"><Label className={labelCls}>Web personal</Label><Input defaultValue="andreacastillo.design" className={inputCls} /></div>
          </div>
        </TabsContent>

        <TabsContent value="notificaciones" className="mt-8">
          <div className={cardCls}>
            <Toggle title="Nuevas vacantes con match" desc="Recibe alertas cuando aparezcan oportunidades >85% match." defaultChecked />
            <Toggle title="Mensajes de recruiters" desc="Notificación inmediata cuando alguien te escriba." defaultChecked />
            <Toggle title="Resumen semanal" desc="Email los lunes con tendencias del mercado." defaultChecked />
            <Toggle title="Eventos y workshops" desc="Avisos de actividades de la comunidad." />
          </div>
        </TabsContent>

        <TabsContent value="privacidad" className="mt-8">
          <div className={cardCls}>
            <Toggle title="Perfil público" desc="Cualquiera con el link puede ver tu perfil." defaultChecked />
            <Toggle title="Visible para recruiters" desc="Apareces en búsquedas de talento." defaultChecked />
            <Toggle title="Mostrar salario esperado" desc="Solo visible para empresas premium." />
          </div>
        </TabsContent>

        <TabsContent value="seguridad" className="mt-8">
          <div className={cardCls + " space-y-6"}>
            <div>
              <h3 className="font-subtitle font-semibold text-sm">Cambiar contraseña</h3>
              <div className="mt-3 space-y-3">
                <Input type="password" placeholder="Contraseña actual" className={inputCls} />
                <Input type="password" placeholder="Nueva contraseña" className={inputCls} />
              </div>
            </div>
            <div className="pt-5 border-t border-border">
              <Toggle title="Autenticación 2FA" desc="Protege tu cuenta con un segundo factor." />
              <Toggle title="Sesiones activas" desc="Revisa dispositivos conectados a tu cuenta." defaultChecked />
            </div>
            <div className="pt-5 border-t border-border">
              <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive rounded-xl font-subtitle">Eliminar cuenta</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="facturacion" className="mt-8">
          <div className={cardCls}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="text-xs font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Plan actual</div>
                <div className="font-display text-2xl font-bold mt-2">Joblify Pro</div>
                <div className="text-sm text-muted-foreground mt-1 font-sans">USD 12 / mes · próxima renovación 12 nov</div>
              </div>
              <Button variant="outline" className="rounded-xl font-subtitle">Cambiar plan</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default Configuracion;
