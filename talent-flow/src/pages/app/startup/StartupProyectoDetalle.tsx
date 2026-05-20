import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Rocket,
  Trash2,
  Users,
} from "lucide-react";
import { startupApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const STAGE_OPTIONS = [
  { value: "Idea", label: "Idea inicial" },
  { value: "MVP", label: "Producto inicial (MVP)" },
  { value: "Seed", label: "Primeras ventas (Seed)" },
  { value: "Serie A", label: "Crecimiento (Serie A)" },
  { value: "Serie B", label: "Expansión (Serie B)" },
] as const;

type StartupStage = (typeof STAGE_OPTIONS)[number]["value"];

const STAGE_LABELS: Record<StartupStage, string> = {
  Idea: "Idea inicial",
  MVP: "Producto inicial (MVP)",
  Seed: "Primeras ventas (Seed)",
  "Serie A": "Crecimiento (Serie A)",
  "Serie B": "Expansión (Serie B)",
};

type StartupRole = {
  id: string;
  title: string;
  description: string;
  equityMin?: number | null;
  equityMax?: number | null;
  isOpen: boolean;
  createdAt: string;
  _count?: { applications?: number };
};

type StartupApplication = {
  id: string;
  status: "PENDIENTE" | "EN_REVISION" | "ACEPTADO" | "RECHAZADO";
  motivation: string;
  createdAt: string;
  role?: { id: string; title: string } | null;
  applicant: { id: string; name: string; headline?: string | null; avatarUrl?: string | null };
};

type StartupDetail = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  stage: StartupStage;
  sector?: string | null;
  website?: string | null;
  deckUrl?: string | null;
  isActive: boolean;
  founder: { id: string; name: string; headline?: string | null; avatarUrl?: string | null };
  openRoles: StartupRole[];
  _count?: { applications?: number };
  applications: StartupApplication[];
};

type StartupFormState = {
  name: string;
  tagline: string;
  description: string;
  stage: StartupStage;
  sector: string;
  website: string;
  deckUrl: string;
};

type RoleFormState = {
  title: string;
  description: string;
  equityMin: string;
  equityMax: string;
};

const emptyRoleForm: RoleFormState = {
  title: "",
  description: "",
  equityMin: "",
  equityMax: "",
};

const StartupProyectoDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const [editOpen, setEditOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [form, setForm] = useState<StartupFormState>({
    name: "",
    tagline: "",
    description: "",
    stage: "Idea",
    sector: "",
    website: "",
    deckUrl: "",
  });
  const [roleForm, setRoleForm] = useState<RoleFormState>(emptyRoleForm);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    enabled: Boolean(id),
    queryKey: ["startup", id],
    queryFn: async () => {
      const response = await startupApi.get(id!);
      return response.data as StartupDetail;
    },
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      name: data.name,
      tagline: data.tagline,
      description: data.description,
      stage: data.stage,
      sector: data.sector || "",
      website: data.website || "",
      deckUrl: data.deckUrl || "",
    });
  }, [data]);

  const isOwner = data && user?.id === data.founder.id;

  const updateStartup = useMutation({
    mutationFn: (payload: Record<string, unknown>) => startupApi.update(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["startup", id] });
      queryClient.invalidateQueries({ queryKey: ["startups", "my-owned"] });
      toast.success("Startup actualizada");
      setEditOpen(false);
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || "No se pudo actualizar";
      toast.error(message);
    },
  });

  const archiveStartup = useMutation({
    mutationFn: () => startupApi.archive(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["startups", "my-owned"] });
      toast.success("Proyecto archivado");
      navigate("/app/startup/proyectos");
    },
    onError: () => toast.error("No se pudo archivar"),
  });

  const saveRole = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      editingRoleId ? startupApi.updateRole(editingRoleId, payload) : startupApi.createRole(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["startup", id] });
      queryClient.invalidateQueries({ queryKey: ["startups", "my-owned"] });
      toast.success(editingRoleId ? "Rol actualizado" : "Rol creado");
      setRoleForm(emptyRoleForm);
      setEditingRoleId(null);
      setRoleOpen(false);
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || "No se pudo guardar el rol";
      toast.error(message);
    },
  });

  const deleteRole = useMutation({
    mutationFn: (roleId: string) => startupApi.deleteRole(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["startup", id] });
      queryClient.invalidateQueries({ queryKey: ["startups", "my-owned"] });
      toast.success("Rol eliminado");
    },
    onError: () => toast.error("No se pudo eliminar el rol"),
  });

  const toggleRole = useMutation({
    mutationFn: ({ roleId, isOpen }: { roleId: string; isOpen: boolean }) => startupApi.updateRole(roleId, { isOpen }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["startup", id] });
      toast.success("Estado del rol actualizado");
    },
    onError: () => toast.error("No se pudo actualizar el rol"),
  });

  const handleEditSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateStartup.mutate({
      name: form.name,
      tagline: form.tagline,
      description: form.description,
      stage: form.stage,
      sector: form.sector || undefined,
      website: form.website || undefined,
      deckUrl: form.deckUrl || undefined,
    });
  };

  const handleRoleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: Record<string, unknown> = {
      title: roleForm.title,
      description: roleForm.description,
    };
    if (roleForm.equityMin) payload.equityMin = Number(roleForm.equityMin);
    if (roleForm.equityMax) payload.equityMax = Number(roleForm.equityMax);
    saveRole.mutate(payload);
  };

  const openCreateRole = () => {
    setEditingRoleId(null);
    setRoleForm(emptyRoleForm);
    setRoleOpen(true);
  };

  const openEditRole = (role: StartupRole) => {
    setEditingRoleId(role.id);
    setRoleForm({
      title: role.title,
      description: role.description,
      equityMin: role.equityMin?.toString() || "",
      equityMax: role.equityMax?.toString() || "",
    });
    setRoleOpen(true);
  };

  const totalOpenRoles = useMemo(() => data?.openRoles.filter((role) => role.isOpen).length || 0, [data]);
  const shareUrl = useMemo(() => {
    if (!data) return "";
    if (typeof window === "undefined") return `/app/startup/proyectos/${data.id}`;
    return `${window.location.origin}/app/startup/proyectos/${data.id}`;
  }, [data]);

  return (
    <div>
      <Link to="/app/startup/proyectos" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Volver a proyectos
      </Link>

      {isLoading && (
        <div className="mt-10 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando proyecto...
        </div>
      )}

      {!isLoading && data && (
        <div className="mt-6 space-y-8">
          <PageHeader eyebrow="Proyecto de emprendedor" title={data.name} subtitle={data.tagline} />
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <Badge variant="outline" className="bg-surface-elevated">Etapa: {STAGE_LABELS[data.stage] || data.stage}</Badge>
            <span className="inline-flex items-center gap-1">
              <Rocket className="h-3.5 w-3.5" /> {data._count?.applications || 0} postulantes
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {totalOpenRoles} roles abiertos
            </span>
          </div>

          {isOwner && (
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" className="rounded-full" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" /> Editar info
              </Button>
              <Button className="rounded-full" onClick={openCreateRole}>
                <Plus className="h-4 w-4" /> Nuevo rol
              </Button>
              <Button
                variant="outline"
                className="rounded-full text-destructive border-destructive"
                disabled={archiveStartup.isPending}
                onClick={() => archiveStartup.mutate()}
              >
                {archiveStartup.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Archivar proyecto
              </Button>
            </div>
          )}

          <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <article className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="font-subtitle font-semibold">Sobre el proyecto</h2>
              <p className="text-sm font-sans text-muted-foreground whitespace-pre-line">{data.description}</p>
              <div className="grid sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> {data.sector || "Sector no definido"}
                </div>
                {data.website && (
                  <a
                    href={data.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-primary"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Sitio web
                  </a>
                )}
                {data.deckUrl && (
                  <a
                    href={data.deckUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-primary"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Pitch deck
                  </a>
                )}
              </div>
            </article>

            <article className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-subtitle font-semibold">Fundador</h2>
              <p className="mt-3 font-subtitle">{data.founder.name}</p>
              <p className="text-xs text-muted-foreground">{data.founder.headline || "Sin descripción breve"}</p>
              <p className="mt-4 text-xs text-muted-foreground">Comparte este enlace para atraer cofundadores:</p>
              <p className="text-sm font-mono text-foreground break-all">{shareUrl}</p>
            </article>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-subtitle font-semibold">Roles abiertos</h2>
                <p className="text-xs text-muted-foreground">Define qué perfiles necesitas y monitorea su estado.</p>
              </div>
              {isOwner && (
                <Button size="sm" className="rounded-full" onClick={openCreateRole}>
                  <Plus className="h-3 w-3" /> Agregar rol
                </Button>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {data.openRoles.length === 0 && (
                <p className="text-sm text-muted-foreground">Todavía no publicaste roles. Agrega al menos uno para recibir postulantes.</p>
              )}
              {data.openRoles.map((role) => (
                <article key={role.id} className="rounded-2xl border border-border bg-card p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-subtitle font-semibold">{role.title}</h3>
                      <p className="text-xs text-muted-foreground">{role.isOpen ? "Buscando" : "Cerrado"} · {role._count?.applications || 0} postulantes</p>
                    </div>
                    {isOwner && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          disabled={toggleRole.isPending}
                          onClick={() => toggleRole.mutate({ roleId: role.id, isOpen: !role.isOpen })}
                        >
                          {role.isOpen ? "Cerrar" : "Reabrir"}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditRole(role)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteRole.mutate(role.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">{role.description}</p>
                  {(role.equityMin || role.equityMax) && (
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase">Equity: {role.equityMin || 0}% - {role.equityMax || role.equityMin || 0}%</p>
                  )}
                </article>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-subtitle font-semibold">Postulaciones recientes</h2>
                <p className="text-xs text-muted-foreground">Últimas 10 aplicaciones a tus roles fundadores.</p>
              </div>
              <Link to="/app/startup/postulantes" className="text-xs font-semibold text-primary">Ver todas</Link>
            </div>
            <div className="space-y-3">
              {data.applications.length === 0 && <p className="text-sm text-muted-foreground">No hay postulaciones todavía.</p>}
              {data.applications.map((app) => (
                <article key={app.id} className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-subtitle font-semibold">{app.applicant.name}</p>
                      <p className="text-xs text-muted-foreground">{app.role?.title || "Rol general"}</p>
                    </div>
                    <Badge variant="outline" className="bg-surface-elevated">
                      {app.status === "PENDIENTE"
                        ? "Nuevo"
                        : app.status === "EN_REVISION"
                          ? "En revisión"
                          : app.status === "ACEPTADO"
                            ? "Aceptado"
                            : "Rechazado"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{app.motivation}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar startup</DialogTitle>
            <DialogDescription>Actualiza la información pública del proyecto.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleEditSubmit}>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider">Nombre</label>
              <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider">Tagline</label>
              <Input value={form.tagline} onChange={(e) => setForm((prev) => ({ ...prev, tagline: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider">Descripción</label>
              <Textarea rows={4} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider">Etapa</label>
                <select
                  id="startup-stage-edit"
                  title="Etapa del proyecto"
                  aria-label="Etapa del proyecto"
                  value={form.stage}
                  onChange={(e) => setForm((prev) => ({ ...prev, stage: e.target.value as StartupStage }))}
                  className="h-11 w-full rounded-xl bg-surface-elevated border border-border px-3 text-sm"
                >
                  {STAGE_OPTIONS.map((stage) => (
                    <option key={stage.value} value={stage.value}>
                      {stage.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider">Industria</label>
                <Input value={form.sector} onChange={(e) => setForm((prev) => ({ ...prev, sector: e.target.value }))} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider">Website</label>
                <Input value={form.website} onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))} placeholder="https://" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider">Pitch deck</label>
                <Input value={form.deckUrl} onChange={(e) => setForm((prev) => ({ ...prev, deckUrl: e.target.value }))} placeholder="https://" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={updateStartup.isPending}>
                {updateStartup.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={roleOpen} onOpenChange={setRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRoleId ? "Editar rol" : "Nuevo rol"}</DialogTitle>
            <DialogDescription>Describe qué tipo de cofundador necesitas.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleRoleSubmit}>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider">Título</label>
              <Input value={roleForm.title} onChange={(e) => setRoleForm((prev) => ({ ...prev, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider">Descripción</label>
              <Textarea rows={4} value={roleForm.description} onChange={(e) => setRoleForm((prev) => ({ ...prev, description: e.target.value }))} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider">Equity mínima (%)</label>
                <Input value={roleForm.equityMin} onChange={(e) => setRoleForm((prev) => ({ ...prev, equityMin: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider">Equity máxima (%)</label>
                <Input value={roleForm.equityMax} onChange={(e) => setRoleForm((prev) => ({ ...prev, equityMax: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saveRole.isPending}>
                {saveRole.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editingRoleId ? "Actualizar" : "Publicar rol"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StartupProyectoDetalle;
