import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { CVUploader } from "@/components/CVUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/store/authStore";
import { userApi } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Save, Sparkles } from "lucide-react";

type CVAnalysis = {
  headline: string;
  bio: string;
  skills: string[];
  experienceYears: number;
  recommendation: string;
};

const TalentoPerfil = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [headline, setHeadline] = useState(user?.headline || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [skills, setSkills] = useState<string[]>([]);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user", "me"],
    queryFn: async () => {
      const { data } = await userApi.me();
      setHeadline(data.headline || "");
      setBio(data.bio || "");
      setSkills(data.skills?.map((s: { skill: { name: string } }) => s.skill.name) || []);
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { headline?: string; bio?: string }) => userApi.updateMe(data),
    onSuccess: () => {
      toast.success("Perfil actualizado");
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
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
    updateMutation.mutate({ headline, bio });
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
      <PageHeader
        eyebrow="Mi perfil"
        title="Información profesional"
        subtitle="Completa tu perfil para mejorar tus matches con IA"
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-white p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-subtitle font-semibold text-foreground">Datos básicos</h3>
            </div>

            <div className="space-y-4">
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
                <Label htmlFor="bio" className="text-xs font-subtitle font-semibold text-muted-foreground uppercase tracking-wider">
                  Sobre ti
                </Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Cuéntanos sobre tu experiencia, logros y objetivos profesionales..."
                  className="mt-1.5 min-h-[120px]"
                />
              </div>

              <div>
                <Label className="text-xs font-subtitle font-semibold text-muted-foreground uppercase tracking-wider">
                  Skills
                </Label>
                <div className="mt-1.5 flex flex-wrap gap-1.5 min-h-[40px] p-2 rounded-lg border border-border bg-surface-elevated">
                  {skills.length > 0 ? (
                    skills.map((skill, i) => (
                      <span key={i} className="text-xs font-medium px-2.5 py-1 rounded-md bg-primary/15 font-sans">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground font-sans">
                      Sube tu CV para detectar skills automáticamente
                    </span>
                  )}
                </div>
              </div>

              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="w-full h-10 bg-foreground text-background hover:bg-foreground/90 rounded-xl font-subtitle font-semibold"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar cambios
                  </>
                )}
              </Button>
            </div>
          </div>

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
        </div>

        <div>
          <div className="rounded-2xl border border-border bg-white p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-subtitle font-semibold text-foreground">Analizar CV con IA</h3>
            </div>
            <p className="text-sm text-muted-foreground font-sans mb-4">
              Sube tu CV en PDF y nuestra IA extraerá automáticamente tu información profesional, skills y experiencia.
            </p>
            <CVUploader onApplyData={handleApplyCVData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TalentoPerfil;
