import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { CVUploader } from "@/components/CVUploader";
import { ProfileImprovementModal } from "@/components/ProfileImprovementModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/store/authStore";
import { userApi } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Save, Sparkles, Edit2, MapPin, Briefcase, Calendar, X, Plus, Pencil, Trash2 } from "lucide-react";

type CVAnalysis = {
  headline: string;
  bio: string;
  skills: string[];
  experienceYears: number;
  recommendation: string;
};

type ExperienceItem = {
  id: string;
  title: string;
  company: string;
  location?: string | null;
  startDate: string;
  endDate?: string | null;
  current?: boolean;
  description?: string | null;
};

type EducationItem = {
  id: string;
  institution: string;
  degree: string;
  field?: string | null;
  startDate: string;
  endDate?: string | null;
  current?: boolean;
};

const TalentoPerfilNuevo = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [improvementModalOpen, setImprovementModalOpen] = useState(false);
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [isAddingExperience, setIsAddingExperience] = useState(false);
  const [editingExperienceId, setEditingExperienceId] = useState<string | null>(null);
  const [newExperience, setNewExperience] = useState({
    title: "",
    company: "",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
    description: "",
  });
  const [isAddingEducation, setIsAddingEducation] = useState(false);
  const [editingEducationId, setEditingEducationId] = useState<string | null>(null);
  const [newEducation, setNewEducation] = useState({
    institution: "",
    degree: "",
    field: "",
    startDate: "",
    endDate: "",
    current: false,
  });
  const [editEducationForm, setEditEducationForm] = useState({
    institution: "",
    degree: "",
    field: "",
    startDate: "",
    endDate: "",
    current: false,
  });
  const [editExperienceForm, setEditExperienceForm] = useState({
    title: "",
    company: "",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
    description: "",
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user", "me"],
    queryFn: async () => {
      const { data } = await userApi.me();
      setHeadline(data.headline || "");
      setBio(data.bio || "");
      setLocation(data.location || "");
      setSkills(data.skills?.map((s: { skill: { name: string } }) => s.skill.name) || []);
      return data;
    },
  });

  const addEducationMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => userApi.addEducation(data),
    onSuccess: () => {
      toast.success("Estudio agregado");
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
      setIsAddingEducation(false);
      setNewEducation({ institution: "", degree: "", field: "", startDate: "", endDate: "", current: false });
    },
    onError: () => {
      toast.error("No se pudo guardar el estudio");
    },
  });

  const updateEducationMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => userApi.updateEducation(id, data),
    onSuccess: () => {
      toast.success("Estudio actualizado");
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
      setEditingEducationId(null);
    },
    onError: () => {
      toast.error("No se pudo actualizar el estudio");
    },
  });

  const deleteEducationMutation = useMutation({
    mutationFn: (id: string) => userApi.deleteEducation(id),
    onSuccess: () => {
      toast.success("Estudio eliminado");
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
    },
    onError: () => {
      toast.error("No se pudo eliminar el estudio");
    },
  });

  const addExperienceMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => userApi.addExperience(data),
    onSuccess: () => {
      toast.success("Experiencia agregada");
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
      setIsAddingExperience(false);
      setNewExperience({ title: "", company: "", location: "", startDate: "", endDate: "", current: false, description: "" });
    },
    onError: () => {
      toast.error("No se pudo guardar la experiencia");
    },
  });

  const updateExperienceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => userApi.updateExperience(id, data),
    onSuccess: () => {
      toast.success("Experiencia actualizada");
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
      setEditingExperienceId(null);
    },
    onError: () => {
      toast.error("No se pudo actualizar la experiencia");
    },
  });

  const deleteExperienceMutation = useMutation({
    mutationFn: (id: string) => userApi.deleteExperience(id),
    onSuccess: () => {
      toast.success("Experiencia eliminada");
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
    },
    onError: () => {
      toast.error("No se pudo eliminar la experiencia");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { headline?: string; bio?: string; location?: string }) => userApi.updateMe(data),
    onSuccess: () => {
      toast.success("Perfil actualizado");
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
      setIsEditing(false);
    },
    onError: () => {
      toast.error("Error actualizando perfil");
    },
  });

  const syncSkillsMutation = useMutation({
    mutationFn: (skillNames: string[]) => userApi.syncSkills(skillNames),
    onSuccess: () => {
      toast.success("Skills actualizadas");
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
    },
    onError: () => {
      toast.error("Error actualizando skills");
    },
  });

  const handleApplyCVData = (analysis: CVAnalysis) => {
    setHeadline(analysis.headline);
    setBio(analysis.bio);
    setSkills(analysis.skills);
    
    updateMutation.mutate({
      headline: analysis.headline,
      bio: analysis.bio,
    });
    
    if (analysis.skills.length > 0) {
      syncSkillsMutation.mutate(analysis.skills);
    }
  };

  const handleSave = () => {
    updateMutation.mutate({ headline, bio, location });
  };

  const experienceItems: ExperienceItem[] = Array.isArray(profile?.experience) ? profile.experience : [];
  const educationItems: EducationItem[] = Array.isArray(profile?.education) ? profile.education : [];

  const formatMonthYear = (value?: string | null) => {
    if (!value) return "Presente";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString("es-ES", { month: "short", year: "numeric" });
  };

  const saveNewExperience = () => {
    if (!newExperience.title || !newExperience.company || !newExperience.startDate) {
      toast.error("Cargo, empresa y fecha de inicio son obligatorios");
      return;
    }

    addExperienceMutation.mutate({
      title: newExperience.title,
      company: newExperience.company,
      location: newExperience.location || undefined,
      startDate: newExperience.startDate,
      endDate: newExperience.current ? undefined : newExperience.endDate || undefined,
      current: newExperience.current,
      description: newExperience.description || undefined,
    });
  };

  const saveNewEducation = () => {
    if (!newEducation.institution || !newEducation.degree || !newEducation.startDate) {
      toast.error("Institución, título y fecha de inicio son obligatorios");
      return;
    }

    addEducationMutation.mutate({
      institution: newEducation.institution,
      degree: newEducation.degree,
      field: newEducation.field || undefined,
      startDate: newEducation.startDate,
      endDate: newEducation.current ? undefined : newEducation.endDate || undefined,
      current: newEducation.current,
    });
  };

  const startEditEducation = (education: EducationItem) => {
    setEditingEducationId(education.id);
    setEditEducationForm({
      institution: education.institution || "",
      degree: education.degree || "",
      field: education.field || "",
      startDate: education.startDate ? String(education.startDate).slice(0, 10) : "",
      endDate: education.endDate ? String(education.endDate).slice(0, 10) : "",
      current: Boolean(education.current),
    });
  };

  const saveEditedEducation = () => {
    if (!editingEducationId) return;
    if (!editEducationForm.institution || !editEducationForm.degree || !editEducationForm.startDate) {
      toast.error("Institución, título y fecha de inicio son obligatorios");
      return;
    }

    updateEducationMutation.mutate({
      id: editingEducationId,
      data: {
        institution: editEducationForm.institution,
        degree: editEducationForm.degree,
        field: editEducationForm.field || undefined,
        startDate: editEducationForm.startDate,
        endDate: editEducationForm.current ? "" : editEducationForm.endDate || "",
        current: editEducationForm.current,
      },
    });
  };

  const startEditExperience = (experience: ExperienceItem) => {
    setEditingExperienceId(experience.id);
    setEditExperienceForm({
      title: experience.title || "",
      company: experience.company || "",
      location: experience.location || "",
      startDate: experience.startDate ? String(experience.startDate).slice(0, 10) : "",
      endDate: experience.endDate ? String(experience.endDate).slice(0, 10) : "",
      current: Boolean(experience.current),
      description: experience.description || "",
    });
  };

  const saveEditedExperience = () => {
    if (!editingExperienceId) return;
    if (!editExperienceForm.title || !editExperienceForm.company || !editExperienceForm.startDate) {
      toast.error("Cargo, empresa y fecha de inicio son obligatorios");
      return;
    }

    updateExperienceMutation.mutate({
      id: editingExperienceId,
      data: {
        title: editExperienceForm.title,
        company: editExperienceForm.company,
        location: editExperienceForm.location || undefined,
        startDate: editExperienceForm.startDate,
        endDate: editExperienceForm.current ? "" : editExperienceForm.endDate || "",
        current: editExperienceForm.current,
        description: editExperienceForm.description || undefined,
      },
    });
  };

  const handleCancel = () => {
    setHeadline(profile?.headline || "");
    setBio(profile?.bio || "");
    setLocation(profile?.location || "");
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          eyebrow="Mi perfil"
          title={profile?.name || "Usuario"}
          subtitle={isEditing ? "Editando información profesional" : "Información profesional"}
        />
        {!isEditing ? (
          <Button
            onClick={() => setIsEditing(true)}
            className="h-11 px-5 bg-foreground text-background hover:bg-foreground/90 rounded-xl font-subtitle font-semibold"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Editar perfil
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="h-11 px-5 rounded-xl font-subtitle font-semibold"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="h-11 px-5 bg-foreground text-background hover:bg-foreground/90 rounded-xl font-subtitle font-semibold"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Guardar cambios
            </Button>
          </div>
        )}
      </div>

      {!isEditing ? (
        // Vista de perfil completo
        <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
          <div className="space-y-6">
            {/* Información principal */}
            <div className="rounded-2xl border border-border bg-white p-8">
              <div className="flex items-start gap-6">
                <div className="h-24 w-24 rounded-full bg-foreground text-background flex items-center justify-center text-2xl font-semibold shrink-0">
                  {profile?.name?.slice(0, 2).toUpperCase() || "US"}
                </div>
                <div className="flex-1">
                  <h2 className="font-display text-2xl font-bold text-foreground">{profile?.name || "Usuario"}</h2>
                  <p className="text-lg text-muted-foreground font-sans mt-1">
                    {profile?.headline || "Agrega un título profesional"}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                    {profile?.location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        {profile.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4" />
                      {profile?.role || "Candidato"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      Miembro desde {new Date(profile?.createdAt || Date.now()).toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
                    </span>
                  </div>
                </div>
              </div>

              {profile?.bio && (
                <div className="mt-6 pt-6 border-t border-border">
                  <h3 className="font-subtitle font-semibold text-foreground mb-2">Sobre mí</h3>
                  <p className="text-sm text-muted-foreground font-sans leading-relaxed">
                    {profile.bio}
                  </p>
                </div>
              )}
            </div>

            {/* Skills */}
            <div className="rounded-2xl border border-border bg-white p-6">
              <h3 className="font-subtitle font-semibold text-foreground mb-4">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {skills.length > 0 ? (
                  skills.map((skill, i) => (
                    <span key={i} className="text-sm font-medium px-3 py-1.5 rounded-lg bg-primary/15 text-foreground font-sans">
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground font-sans">
                    Sube tu CV para detectar skills automáticamente
                  </p>
                )}
              </div>
            </div>

            {/* Experiencia */}
            <div className="rounded-2xl border border-border bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-subtitle font-semibold text-foreground">Experiencia</h3>
                <Button
                  variant="outline"
                  className="h-8 px-3 rounded-lg text-xs font-subtitle font-semibold"
                  onClick={() => {
                    setEditingExperienceId(null);
                    setIsAddingExperience((prev) => !prev);
                  }}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  {isAddingExperience ? "Cancelar" : "Agregar"}
                </Button>
              </div>

              {isAddingExperience && (
                <div className="mb-4 grid gap-3 rounded-xl border border-border p-4">
                  <Input placeholder="Cargo" value={newExperience.title} onChange={(e) => setNewExperience((p) => ({ ...p, title: e.target.value }))} />
                  <Input placeholder="Empresa" value={newExperience.company} onChange={(e) => setNewExperience((p) => ({ ...p, company: e.target.value }))} />
                  <Input placeholder="Ubicación" value={newExperience.location} onChange={(e) => setNewExperience((p) => ({ ...p, location: e.target.value }))} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input type="date" value={newExperience.startDate} onChange={(e) => setNewExperience((p) => ({ ...p, startDate: e.target.value }))} />
                    <Input type="date" value={newExperience.endDate} onChange={(e) => setNewExperience((p) => ({ ...p, endDate: e.target.value }))} disabled={newExperience.current} />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground font-sans">
                    <input type="checkbox" checked={newExperience.current} onChange={(e) => setNewExperience((p) => ({ ...p, current: e.target.checked }))} />
                    Trabajo actual
                  </label>
                  <Textarea
                    placeholder="Describe tus responsabilidades y logros"
                    value={newExperience.description}
                    onChange={(e) => setNewExperience((p) => ({ ...p, description: e.target.value }))}
                    className="min-h-[90px]"
                  />
                  <Button
                    onClick={saveNewExperience}
                    disabled={addExperienceMutation.isPending || !newExperience.title || !newExperience.company || !newExperience.startDate}
                    className="h-10 rounded-xl font-subtitle font-semibold"
                  >
                    {addExperienceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar experiencia"}
                  </Button>
                </div>
              )}

              <div className="space-y-3">
                {experienceItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground font-sans">Aún no has agregado experiencia laboral.</p>
                ) : (
                  experienceItems.map((experience) => (
                    <div key={experience.id} className="rounded-xl border border-border p-4">
                      {editingExperienceId === experience.id ? (
                        <div className="space-y-3">
                          <Input placeholder="Cargo" value={editExperienceForm.title} onChange={(e) => setEditExperienceForm((p) => ({ ...p, title: e.target.value }))} />
                          <Input placeholder="Empresa" value={editExperienceForm.company} onChange={(e) => setEditExperienceForm((p) => ({ ...p, company: e.target.value }))} />
                          <Input placeholder="Ubicación" value={editExperienceForm.location} onChange={(e) => setEditExperienceForm((p) => ({ ...p, location: e.target.value }))} />
                          <div className="grid grid-cols-2 gap-3">
                            <Input type="date" value={editExperienceForm.startDate} onChange={(e) => setEditExperienceForm((p) => ({ ...p, startDate: e.target.value }))} />
                            <Input type="date" value={editExperienceForm.endDate} onChange={(e) => setEditExperienceForm((p) => ({ ...p, endDate: e.target.value }))} disabled={editExperienceForm.current} />
                          </div>
                          <label className="flex items-center gap-2 text-xs text-muted-foreground font-sans">
                            <input type="checkbox" checked={editExperienceForm.current} onChange={(e) => setEditExperienceForm((p) => ({ ...p, current: e.target.checked }))} />
                            Trabajo actual
                          </label>
                          <Textarea
                            placeholder="Describe tus responsabilidades y logros"
                            value={editExperienceForm.description}
                            onChange={(e) => setEditExperienceForm((p) => ({ ...p, description: e.target.value }))}
                            className="min-h-[90px]"
                          />
                          <div className="flex items-center gap-2">
                            <Button onClick={saveEditedExperience} disabled={updateExperienceMutation.isPending} className="h-9 px-3 rounded-lg text-xs font-subtitle font-semibold">
                              {updateExperienceMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Guardar"}
                            </Button>
                            <Button variant="outline" onClick={() => setEditingExperienceId(null)} className="h-9 px-3 rounded-lg text-xs font-subtitle font-semibold">
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="font-subtitle font-semibold text-foreground">{experience.title}</h4>
                              <p className="text-sm text-muted-foreground font-sans">{experience.company}{experience.location ? ` · ${experience.location}` : ""}</p>
                              <p className="text-xs text-muted-foreground font-sans mt-1">
                                {formatMonthYear(experience.startDate)} - {experience.current ? "Actual" : formatMonthYear(experience.endDate)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEditExperience(experience)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => deleteExperienceMutation.mutate(experience.id)}
                                disabled={deleteExperienceMutation.isPending}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          {experience.description && (
                            <p className="mt-3 text-sm text-muted-foreground font-sans leading-relaxed">{experience.description}</p>
                          )}
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Educación */}
            <div className="rounded-2xl border border-border bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-subtitle font-semibold text-foreground">Estudios</h3>
                <Button
                  variant="outline"
                  className="h-8 px-3 rounded-lg text-xs font-subtitle font-semibold"
                  onClick={() => {
                    setEditingEducationId(null);
                    setIsAddingEducation((prev) => !prev);
                  }}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  {isAddingEducation ? "Cancelar" : "Agregar"}
                </Button>
              </div>

              {isAddingEducation && (
                <div className="mb-4 grid gap-3 rounded-xl border border-border p-4">
                  <Input placeholder="Institución" value={newEducation.institution} onChange={(e) => setNewEducation((p) => ({ ...p, institution: e.target.value }))} />
                  <Input placeholder="Título o programa" value={newEducation.degree} onChange={(e) => setNewEducation((p) => ({ ...p, degree: e.target.value }))} />
                  <Input placeholder="Área (opcional)" value={newEducation.field} onChange={(e) => setNewEducation((p) => ({ ...p, field: e.target.value }))} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input type="date" value={newEducation.startDate} onChange={(e) => setNewEducation((p) => ({ ...p, startDate: e.target.value }))} />
                    <Input type="date" value={newEducation.endDate} onChange={(e) => setNewEducation((p) => ({ ...p, endDate: e.target.value }))} disabled={newEducation.current} />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground font-sans">
                    <input type="checkbox" checked={newEducation.current} onChange={(e) => setNewEducation((p) => ({ ...p, current: e.target.checked }))} />
                    En curso
                  </label>
                  <Button
                    onClick={saveNewEducation}
                    disabled={addEducationMutation.isPending || !newEducation.institution || !newEducation.degree || !newEducation.startDate}
                    className="h-10 rounded-xl font-subtitle font-semibold"
                  >
                    {addEducationMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar estudio"}
                  </Button>
                </div>
              )}

              <div className="space-y-3">
                {educationItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground font-sans">Aún no has agregado estudios.</p>
                ) : (
                  educationItems.map((education) => (
                    <div key={education.id} className="rounded-xl border border-border p-4">
                      {editingEducationId === education.id ? (
                        <div className="space-y-3">
                          <Input placeholder="Institución" value={editEducationForm.institution} onChange={(e) => setEditEducationForm((p) => ({ ...p, institution: e.target.value }))} />
                          <Input placeholder="Título o programa" value={editEducationForm.degree} onChange={(e) => setEditEducationForm((p) => ({ ...p, degree: e.target.value }))} />
                          <Input placeholder="Área (opcional)" value={editEducationForm.field} onChange={(e) => setEditEducationForm((p) => ({ ...p, field: e.target.value }))} />
                          <div className="grid grid-cols-2 gap-3">
                            <Input type="date" value={editEducationForm.startDate} onChange={(e) => setEditEducationForm((p) => ({ ...p, startDate: e.target.value }))} />
                            <Input type="date" value={editEducationForm.endDate} onChange={(e) => setEditEducationForm((p) => ({ ...p, endDate: e.target.value }))} disabled={editEducationForm.current} />
                          </div>
                          <label className="flex items-center gap-2 text-xs text-muted-foreground font-sans">
                            <input type="checkbox" checked={editEducationForm.current} onChange={(e) => setEditEducationForm((p) => ({ ...p, current: e.target.checked }))} />
                            En curso
                          </label>
                          <div className="flex items-center gap-2">
                            <Button onClick={saveEditedEducation} disabled={updateEducationMutation.isPending} className="h-9 px-3 rounded-lg text-xs font-subtitle font-semibold">
                              {updateEducationMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Guardar"}
                            </Button>
                            <Button variant="outline" onClick={() => setEditingEducationId(null)} className="h-9 px-3 rounded-lg text-xs font-subtitle font-semibold">
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="font-subtitle font-semibold text-foreground">{education.degree}</h4>
                              <p className="text-sm text-muted-foreground font-sans">{education.institution}{education.field ? ` · ${education.field}` : ""}</p>
                              <p className="text-xs text-muted-foreground font-sans mt-1">
                                {formatMonthYear(education.startDate)} - {education.current ? "En curso" : formatMonthYear(education.endDate)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEditEducation(education)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => deleteEducationMutation.mutate(education.id)}
                                disabled={deleteEducationMutation.isPending}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Completitud */}
            <div className="rounded-2xl border border-border bg-white p-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="font-subtitle font-semibold text-foreground">Completitud del perfil</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-sans text-muted-foreground">Progreso</span>
                  <span className="font-subtitle font-semibold text-foreground">
                    {profile?.profileCompletion || 0}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-surface-elevated overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${profile?.profileCompletion || 0}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground font-sans mt-2">
                  Un perfil completo aumenta tus chances de match en un 3x
                </p>
              </div>
            </div>

            {/* Upload CV */}
            <div className="rounded-2xl border border-border bg-white p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-subtitle font-semibold text-foreground">Analizar CV con IA</h3>
              </div>
              <p className="text-sm text-muted-foreground font-sans mb-4">
                Sube tu CV en PDF y nuestra IA extraerá automáticamente tu información profesional en primera persona.
              </p>
              <CVUploader onApplyData={handleApplyCVData} />
            </div>
          </div>
        </div>
      ) : (
        // Modo de edición
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border bg-white p-6 space-y-4">
            <h3 className="font-subtitle font-semibold text-foreground">Información básica</h3>

            <div>
              <Label htmlFor="headline" className="text-xs font-subtitle font-semibold text-muted-foreground uppercase tracking-wider">
                Título profesional
              </Label>
              <Input
                id="headline"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="ej: Senior Product Designer"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="location" className="text-xs font-subtitle font-semibold text-muted-foreground uppercase tracking-wider">
                Ubicación
              </Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="ej: Bogotá, Colombia"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="bio" className="text-xs font-subtitle font-semibold text-muted-foreground uppercase tracking-wider">
                Sobre ti (en primera persona)
              </Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Soy desarrolladora full stack con 5 años de experiencia creando aplicaciones web. Me apasiona el diseño de interfaces y la arquitectura escalable..."
                className="mt-1.5 min-h-[140px]"
              />
              <p className="text-xs text-muted-foreground font-sans mt-1.5">
                Escribe en primera persona para que suene más personal y auténtico
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-subtitle font-semibold text-foreground">Analizar CV con IA</h3>
            </div>
            <p className="text-sm text-muted-foreground font-sans mb-4">
              Sube tu CV y la IA generará automáticamente tu bio en primera persona y detectará tus skills.
            </p>
            <CVUploader onApplyData={handleApplyCVData} />
          </div>
        </div>
      )}

      <ProfileImprovementModal 
        isOpen={improvementModalOpen} 
        onClose={() => setImprovementModalOpen(false)} 
      />
    </div>
  );
};

export default TalentoPerfilNuevo;
