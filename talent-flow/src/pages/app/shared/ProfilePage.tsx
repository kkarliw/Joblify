import { useEffect, useMemo, useRef, useState } from "react";
import { Briefcase, MapPin, Star, Award, Pencil, Plus, Camera, Image as ImageIcon, Save, FileText, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useAuthStore } from "@/store/authStore";
import { aiApi, profileApi, userApi, API_URL, freelanceApi } from "@/lib/api";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

type AIAnalysis = {
  headline?: string;
  bio?: string;
  skills?: string[];
  experienceYears?: number;
  recommendation?: string;
};

type AiProfileSuggestion = {
  field: string;
  tip: string;
  impact: "alto" | "medio" | "bajo";
};

type FreelancerProfileResponse = {
  services?: Array<{
    id: string;
    title: string;
    category: string;
    description: string;
    deliveryDays: number;
    priceMin: number;
    priceMax?: number | null;
    currency: string;
    portfolio?: unknown;
  }>;
  portfolioItems?: string[];
  reviews?: Array<{
    id: string;
    rating: number;
    comment?: string | null;
    reviewer?: { name?: string | null };
    project?: { title?: string | null; client?: { name?: string | null } };
  }>;
  stats?: {
    reviewsCount?: number;
    avgRating?: number | null;
  };
};

const normalizeSkillValues = (items: unknown): string[] => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object" && "name" in item) {
        const name = (item as { name?: unknown }).name;
        if (typeof name === "string") return name.trim();
      }
      return "";
    })
    .filter((value): value is string => Boolean(value));
};

const COLOMBIA_CITIES = [
  "Bogotá, Colombia",
  "Medellín, Colombia",
  "Cali, Colombia",
  "Barranquilla, Colombia",
  "Cartagena, Colombia",
  "Bucaramanga, Colombia",
  "Pereira, Colombia",
  "Manizales, Colombia",
  "Santa Marta, Colombia",
  "Cúcuta, Colombia",
  "Ibagué, Colombia",
  "Villavicencio, Colombia",
  "Pasto, Colombia",
  "Montería, Colombia",
  "Armenia, Colombia",
];

const FALLBACK_WORK_AREAS = [
  "Desarrollo de Software",
  "Diseño UI/UX",
  "Data & IA",
  "Ciencia de Datos",
  "Machine Learning",
  "Ciberseguridad",
  "Cloud & DevOps",
  "QA / Testing",
  "Soporte TI",
  "Administración de Sistemas",
  "Gestión de Proyectos",
  "Product Management",
  "Marketing Digital",
  "SEO / SEM",
  "Contenido y Copywriting",
  "Community Management",
  "Ventas",
  "Business Development",
  "Customer Success",
  "Producto",
  "Recursos Humanos",
  "Reclutamiento y Selección",
  "Operaciones",
  "Finanzas",
  "Contabilidad",
  "Legal",
  "Compras y Logística",
  "E-commerce",
  "Educación y Capacitación",
  "Diseño Gráfico",
  "Audiovisual y Multimedia",
  "Atención Médica y Salud",
  "Atención al Cliente",
];

const ProfilePage = () => {
  const { user: session, setUser: setGlobalUser } = useAuthStore();
  const queryClient = useQueryClient();

  const isFreelancer = session?.role === "freelancer";
  const isEmpresa = session?.role === "empresa";
  const isTalentProfile = session?.role === "candidato" || session?.role === "estudiante";

  const [editing, setEditing] = useState(false);
  const [isUploadingCV, setIsUploadingCV] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [pendingAIAnalysis, setPendingAIAnalysis] = useState<AIAnalysis | null>(null);
  const [aiProfileSuggestions, setAiProfileSuggestions] = useState<AiProfileSuggestion[]>([]);
  const [isAddingExperience, setIsAddingExperience] = useState(false);
  const [skillDraft, setSkillDraft] = useState("");
  const [manualSkills, setManualSkills] = useState<string[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [showWorkAreaSuggestions, setShowWorkAreaSuggestions] = useState(false);

  // Estados locales para edición, se sincronizan con la BD cuando inicia o cancela la edición
  const [editForm, setEditForm] = useState({
    name: "",
    headline: "",
    bio: "",
    location: "",
    workArea: "",
    website: "",
    linkedinUrl: "",
    industry: "",
    companySize: "",
    foundedYear: "",
    teamSize: "",
    specialtiesText: "",
    cultureValuesText: "",
    benefitsText: "",
    companyOverview: "",
    hiringEmail: "",
  });

  const improveProfileMutation = useMutation({
    mutationFn: () => aiApi.improveProfile().then((res) => res.data as { suggestions?: AiProfileSuggestion[] }),
    onSuccess: (data) => {
      const suggestions = Array.isArray(data.suggestions) ? data.suggestions : [];
      setAiProfileSuggestions(suggestions);
      if (suggestions.length === 0) {
        toast.info("La IA no encontró sugerencias en este momento");
        return;
      }
      setEditing(true);
      toast.success("Sugerencias IA listas para aplicar");
    },
    onError: () => {
      toast.error("No se pudieron generar sugerencias IA");
    },
  });

  const [newExperience, setNewExperience] = useState({
    title: "",
    company: "",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
    description: "",
  });
  const [isAddingService, setIsAddingService] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [newServiceForm, setNewServiceForm] = useState({
    title: "",
    category: "",
    description: "",
    priceMin: "",
    priceMax: "",
    deliveryDays: "",
    portfolioText: "",
  });
  const [editServiceForm, setEditServiceForm] = useState({
    title: "",
    category: "",
    description: "",
    priceMin: "",
    priceMax: "",
    deliveryDays: "",
    portfolioText: "",
  });
  const [editingExperienceId, setEditingExperienceId] = useState<string | null>(null);
  const [editExperienceForm, setEditExperienceForm] = useState({
    title: "",
    company: "",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
    description: "",
  });

  const avatarInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const cvInput = useRef<HTMLInputElement>(null);

  // Traer perfil real desde el backend
  const { data: profileResponse, isLoading } = useQuery({
    queryKey: ["profile", "me"],
    queryFn: () => axios.get(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("joblify.token")}` }
    }).then(res => res.data),
    enabled: !!session?.id,
  });

  const { data: freelancerProfile } = useQuery({
    queryKey: ["freelance", "my-profile"],
    queryFn: () => freelanceApi.getMyProfile().then((res) => res.data as FreelancerProfileResponse),
    enabled: !!session?.id && isFreelancer,
  });

  const { data: workAreasResponse } = useQuery({
    queryKey: ["work-areas"],
    queryFn: () => userApi.getWorkAreas().then((res) => res.data as { areas?: string[] }),
    enabled: !!session?.id && editing,
  });

  const { data: profileStats } = useQuery({
    queryKey: ["profile", "stats"],
    queryFn: () =>
      userApi.getMyStats().then(
        (res) =>
          res.data as {
            isVerified?: boolean;
            profileCompletion?: number;
            matchScore?: number | null;
            connectionsCount?: number;
          }
      ),
    enabled: !!session?.id,
  });

  const profile = useMemo(() => profileResponse || {}, [profileResponse]);
  const profileDataObj = typeof profile.profileData === 'string' ? JSON.parse(profile.profileData) : (profile.profileData || {});
  const aiProfile = profileDataObj.aiProfile && typeof profileDataObj.aiProfile === "object" ? profileDataObj.aiProfile : {};
  const relationalSkills = useMemo(
    () =>
      Array.isArray(profile.skills)
        ? profile.skills
            .map((item: { skill?: { name?: string } }) => item.skill?.name)
            .filter((name: string | undefined): name is string => Boolean(name))
        : [],
    [profile.skills]
  );
  const experiences = useMemo(() => (Array.isArray(profile.experience) ? profile.experience : []), [profile.experience]);

  // Extraer skills, recomendación, etc. de profileData o el mismo perfil
  const skills = useMemo(
    () =>
      Array.from(
        new Set([
          ...normalizeSkillValues(aiProfile.skills),
          ...normalizeSkillValues(profileDataObj.skills),
          ...normalizeSkillValues(relationalSkills),
        ])
      ),
    [aiProfile.skills, profileDataObj.skills, relationalSkills]
  );
  const recommendation = aiProfile.recommendation || profileDataObj.recommendation || "";
  const experienceYears = aiProfile.experienceYears || profileDataObj.experienceYears || 0;
  const matchScoreValue = Number(
    profileStats?.matchScore ?? profile.matchScore ?? profileStats?.profileCompletion ?? profile.profileCompletion ?? 0
  );
  const safeMatchScore = Number.isFinite(matchScoreValue) ? Math.max(0, Math.min(100, Math.round(matchScoreValue))) : 0;
  const connectionsCount = Number(profileStats?.connectionsCount ?? 0);
  const filteredCities = useMemo(() => {
    const search = editForm.location.trim().toLowerCase();
    if (!search) return COLOMBIA_CITIES.slice(0, 8);
    return COLOMBIA_CITIES.filter((city) => city.toLowerCase().includes(search)).slice(0, 8);
  }, [editForm.location]);
  const availableWorkAreas = useMemo(() => {
    const fromApi = Array.isArray(workAreasResponse?.areas)
      ? workAreasResponse.areas.filter((area): area is string => Boolean(area?.trim())).map((area) => area.trim())
      : [];
    return Array.from(new Set([...fromApi, ...FALLBACK_WORK_AREAS])).sort((a, b) => a.localeCompare(b));
  }, [workAreasResponse]);
  const filteredWorkAreas = useMemo(() => {
    const search = editForm.workArea.trim().toLowerCase();
    if (!search) return availableWorkAreas.slice(0, 25);
    return availableWorkAreas.filter((area) => area.toLowerCase().includes(search)).slice(0, 25);
  }, [availableWorkAreas, editForm.workArea]);
  const freelancerReviews = useMemo(
    () => (Array.isArray(freelancerProfile?.reviews) ? freelancerProfile.reviews : []),
    [freelancerProfile?.reviews]
  );
  const freelancerPortfolioItems = useMemo(
    () => (Array.isArray(freelancerProfile?.portfolioItems) ? freelancerProfile.portfolioItems.filter(Boolean) : []),
    [freelancerProfile?.portfolioItems]
  );
  const freelancerServices = useMemo(
    () => (Array.isArray(freelancerProfile?.services) ? freelancerProfile.services : []),
    [freelancerProfile?.services]
  );

  useEffect(() => {
    if (profile && !editing) {
      setEditForm({
        name: profile.name || "",
        headline: profile.headline || "",
        bio: profile.bio || "",
        location: profile.location || "",
        workArea: profileDataObj.workArea || "",
        website: profile.website || "",
        linkedinUrl: profile.linkedinUrl || "",
        industry: typeof profileDataObj.industry === "string" ? profileDataObj.industry : "",
        companySize: typeof profileDataObj.companySize === "string" ? profileDataObj.companySize : "",
        foundedYear:
          typeof profileDataObj.foundedYear === "number"
            ? String(profileDataObj.foundedYear)
            : typeof profileDataObj.foundedYear === "string"
              ? profileDataObj.foundedYear
              : "",
        teamSize: typeof profileDataObj.teamSize === "string" ? profileDataObj.teamSize : "",
        specialtiesText: Array.isArray(profileDataObj.specialties)
          ? profileDataObj.specialties.filter((item: unknown): item is string => typeof item === "string" && Boolean(item.trim())).join(", ")
          : "",
        cultureValuesText: Array.isArray(profileDataObj.cultureValues)
          ? profileDataObj.cultureValues.filter((item: unknown): item is string => typeof item === "string" && Boolean(item.trim())).join(", ")
          : "",
        benefitsText: Array.isArray(profileDataObj.benefits)
          ? profileDataObj.benefits.filter((item: unknown): item is string => typeof item === "string" && Boolean(item.trim())).join(", ")
          : "",
        companyOverview: typeof profileDataObj.companyOverview === "string" ? profileDataObj.companyOverview : "",
        hiringEmail: typeof profileDataObj.hiringEmail === "string" ? profileDataObj.hiringEmail : "",
      });
      setManualSkills(skills);
    }
  }, [
    profile,
    editing,
    profileDataObj.workArea,
    profileDataObj.industry,
    profileDataObj.companySize,
    profileDataObj.foundedYear,
    profileDataObj.teamSize,
    profileDataObj.specialties,
    profileDataObj.cultureValues,
    profileDataObj.benefits,
    profileDataObj.companyOverview,
    profileDataObj.hiringEmail,
    skills,
  ]);

  useEffect(() => {
    if (!isUploadingCV) return;

    const interval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 95) return 95;
        if (prev < 10) return prev + 4;
        if (prev < 30) return prev + 6;
        if (prev < 60) return prev + 5;
        return prev + 3;
      });
    }, 700);

    return () => clearInterval(interval);
  }, [isUploadingCV]);

  // Mutación para actualizar perfil (textos)
  const updateProfile = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const cleanSkills = Array.from(new Set(normalizeSkillValues(manualSkills)));
      const profileUpdate = await userApi.updateMe(data);
      const skillsUpdate = await userApi.syncSkills(cleanSkills);
      return { profile: profileUpdate.data, skills: skillsUpdate.data };
    },
    onSuccess: (res) => {
      queryClient.setQueryData(["profile", "me"], (prev: Record<string, unknown> | undefined) => {
        const previous = prev || {};
        return {
          ...previous,
          ...res.profile,
          skills: Array.isArray(res.skills) ? res.skills : previous.skills,
        };
      });
      setGlobalUser(res.profile); // Sincroniza el estado global de zustand
      queryClient.invalidateQueries({ queryKey: ["profile", "stats"] });
      toast.success("Perfil actualizado");
      setEditing(false);
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error
        || (err as { message?: string })?.message
        || "Hubo un error al guardar los cambios";
      toast.error(message);
    }
  });

  const addExperienceMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => userApi.addExperience(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
      setIsAddingExperience(false);
      setNewExperience({ title: "", company: "", location: "", startDate: "", endDate: "", current: false, description: "" });
      toast.success("Experiencia agregada");
    },
    onError: () => toast.error("No se pudo guardar la experiencia"),
  });

  const deleteExperienceMutation = useMutation({
    mutationFn: (id: string) => userApi.deleteExperience(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
      toast.success("Experiencia eliminada");
    },
    onError: () => toast.error("No se pudo eliminar la experiencia"),
  });

  const updateExperienceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => userApi.updateExperience(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
      setEditingExperienceId(null);
      toast.success("Experiencia actualizada");
    },
    onError: () => toast.error("No se pudo actualizar la experiencia"),
  });

  const createServiceMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => freelanceApi.createService(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["freelance", "my-profile"] });
      setIsAddingService(false);
      setNewServiceForm({
        title: "",
        category: "",
        description: "",
        priceMin: "",
        priceMax: "",
        deliveryDays: "",
        portfolioText: "",
      });
      toast.success("Servicio creado");
    },
    onError: () => toast.error("No se pudo crear el servicio"),
  });

  const updateServiceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => freelanceApi.updateService(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["freelance", "my-profile"] });
      setEditingServiceId(null);
      toast.success("Servicio actualizado");
    },
    onError: () => toast.error("No se pudo actualizar el servicio"),
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id: string) => freelanceApi.deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["freelance", "my-profile"] });
      toast.success("Servicio eliminado");
    },
    onError: () => toast.error("No se pudo eliminar el servicio"),
  });

  // Mutación simulada para subir imágenes (se guardarán en DB real cuando AWS S3 esté listo)
  const uploadImage = async (key: "avatarUrl" | "coverUrl", base64Str: string) => {
    try {
      await userApi.updateMe({ [key]: base64Str });
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
      toast.success(key === "avatarUrl" ? "Foto de perfil actualizada" : "Portada actualizada");
    } catch {
      toast.error("Error al subir imagen");
    }
  };

  const applyAIChanges = () => {
    if (!pendingAIAnalysis) return;

    setEditForm((prev) => ({
      ...prev,
      headline: pendingAIAnalysis.headline || prev.headline,
      bio: pendingAIAnalysis.bio || prev.bio,
    }));

    queryClient.setQueryData(["profile", "me"], (previous: Record<string, unknown> | undefined) => {
      const prev = previous || {};
      const prevProfileData =
        prev.profileData && typeof prev.profileData === "object"
          ? (prev.profileData as Record<string, unknown>)
          : {};

      return {
        ...prev,
        headline: pendingAIAnalysis.headline || prev.headline,
        bio: pendingAIAnalysis.bio || prev.bio,
        profileData: {
          ...prevProfileData,
          aiProfile: pendingAIAnalysis,
        },
      };
    });

    setGlobalUser({
      headline: pendingAIAnalysis.headline || profile.headline,
      bio: pendingAIAnalysis.bio || profile.bio,
    });
    if (pendingAIAnalysis.skills?.length) {
      setManualSkills((prev) => Array.from(new Set([...prev, ...pendingAIAnalysis.skills!])));
    }
    setPendingAIAnalysis(null);
    setEditing(true);
    toast.success("Cambios de IA aplicados. Puedes ajustarlos y guardar.");
  };

  const discardAIChanges = () => {
    setPendingAIAnalysis(null);
    toast("Cambios de IA descartados.");
  };

  const addSkillChip = () => {
    const clean = skillDraft.trim();
    if (!clean) return;
    setManualSkills((prev) => Array.from(new Set([...prev, clean])));
    setSkillDraft("");
  };

  const removeSkillChip = (skillToRemove: string) => {
    setManualSkills((prev) => prev.filter((skill) => skill !== skillToRemove));
  };

  const saveProfile = () => {
    const specialties = editForm.specialtiesText
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const cultureValues = editForm.cultureValuesText
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const benefits = editForm.benefitsText
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const foundedYearNum = Number.parseInt(editForm.foundedYear, 10);

    const mergedProfileData = {
      ...profileDataObj,
      workArea: editForm.workArea,
      aiProfile: profileDataObj.aiProfile,
      ...(isEmpresa
        ? {
            industry: editForm.industry,
            companySize: editForm.companySize,
            foundedYear: Number.isFinite(foundedYearNum) ? foundedYearNum : undefined,
            teamSize: editForm.teamSize,
            specialties,
            cultureValues,
            benefits,
            companyOverview: editForm.companyOverview,
            hiringEmail: editForm.hiringEmail,
          }
        : {}),
    };

    updateProfile.mutate({
      name: editForm.name,
      headline: editForm.headline,
      bio: editForm.bio,
      location: editForm.location,
      ...(isEmpresa
        ? {
            website: editForm.website,
            linkedinUrl: editForm.linkedinUrl,
          }
        : {}),
      profileData: mergedProfileData,
    });
  };

  const parsePortfolioText = (value: string) =>
    Array.from(
      new Set(
        value
          .split(/\n|,/)
          .map((item) => item.trim())
          .filter(Boolean)
      )
    );

  const startEditService = (service: {
    id: string;
    title: string;
    category: string;
    description: string;
    priceMin: number;
    priceMax?: number | null;
    deliveryDays: number;
    portfolio?: unknown;
  }) => {
    setEditingServiceId(service.id);
    const portfolioLinks = Array.isArray(service.portfolio)
      ? service.portfolio.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
      : [];
    setEditServiceForm({
      title: service.title || "",
      category: service.category || "",
      description: service.description || "",
      priceMin: String(service.priceMin ?? ""),
      priceMax: service.priceMax !== null && service.priceMax !== undefined ? String(service.priceMax) : "",
      deliveryDays: String(service.deliveryDays ?? ""),
      portfolioText: portfolioLinks.join("\n"),
    });
  };

  const saveNewService = () => {
    if (!newServiceForm.title || !newServiceForm.category || !newServiceForm.description || !newServiceForm.priceMin || !newServiceForm.deliveryDays) {
      toast.error("Completa título, categoría, descripción, precio base y entrega");
      return;
    }
    createServiceMutation.mutate({
      title: newServiceForm.title,
      category: newServiceForm.category,
      description: newServiceForm.description,
      priceMin: Number(newServiceForm.priceMin),
      priceMax: newServiceForm.priceMax ? Number(newServiceForm.priceMax) : undefined,
      deliveryDays: Number(newServiceForm.deliveryDays),
      portfolio: parsePortfolioText(newServiceForm.portfolioText),
    });
  };

  const saveEditedService = () => {
    if (!editingServiceId) return;
    if (!editServiceForm.title || !editServiceForm.category || !editServiceForm.description || !editServiceForm.priceMin || !editServiceForm.deliveryDays) {
      toast.error("Completa título, categoría, descripción, precio base y entrega");
      return;
    }
    updateServiceMutation.mutate({
      id: editingServiceId,
      data: {
        title: editServiceForm.title,
        category: editServiceForm.category,
        description: editServiceForm.description,
        priceMin: Number(editServiceForm.priceMin),
        priceMax: editServiceForm.priceMax ? Number(editServiceForm.priceMax) : null,
        deliveryDays: Number(editServiceForm.deliveryDays),
        portfolio: parsePortfolioText(editServiceForm.portfolioText),
      },
    });
  };

  const toDateInputValue = (value?: string | null) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  };

  const startEditExperience = (x: {
    id: string;
    title: string;
    company: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    current?: boolean;
    description?: string;
  }) => {
    setEditingExperienceId(x.id);
    setEditExperienceForm({
      title: x.title || "",
      company: x.company || "",
      location: x.location || "",
      startDate: toDateInputValue(x.startDate),
      endDate: toDateInputValue(x.endDate),
      current: Boolean(x.current),
      description: x.description || "",
    });
  };

  const saveEditedExperience = () => {
    if (!editingExperienceId) return;
    if (!editExperienceForm.title || !editExperienceForm.company || !editExperienceForm.startDate) {
      toast.error("Título, empresa y fecha de inicio son obligatorios");
      return;
    }

    updateExperienceMutation.mutate({
      id: editingExperienceId,
      data: {
        title: editExperienceForm.title,
        company: editExperienceForm.company,
        location: editExperienceForm.location,
        startDate: editExperienceForm.startDate,
        endDate: editExperienceForm.current ? "" : editExperienceForm.endDate,
        current: editExperienceForm.current,
        description: editExperienceForm.description,
      },
    });
  };

  const formatExperienceDate = (value?: string | null) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return String(date.getFullYear());
  };

  const onFile = (key: "avatarUrl" | "coverUrl") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = String(reader.result);
      
      // Actualizamos UI inmediatamente por si la red es lenta
      setGlobalUser({ [key]: base64 });

      try {
        await userApi.updateMe({ [key]: base64 });
        queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
        queryClient.invalidateQueries({ queryKey: ["feed"] }); // <-- Forzar recarga del Feed
        toast.success(key === "avatarUrl" ? "Foto de perfil actualizada" : "Portada actualizada");
      } catch {
        toast.error("Error al subir imagen");
      }
    };
    reader.readAsDataURL(file);
  };

  const onUploadCV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("El archivo debe ser un PDF válido");
      return;
    }

    setPendingAIAnalysis(null);
    setAnalysisProgress(4);
    setIsUploadingCV(true);
    toast("Subiendo CV y analizando con Inteligencia Artificial...");

    try {
      const response = await profileApi.uploadCV(file);
      const { aiAnalysis } = response.data as { aiAnalysis: AIAnalysis };

      setPendingAIAnalysis(aiAnalysis);
      setAnalysisProgress(100);

      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
      setEditing(true);

      toast.success("Análisis listo. Puedes aplicar o descartar los cambios de IA.");
    } catch (err: unknown) {
      console.error(err);
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Error al analizar el CV con IA.";
      toast.error(message);
    } finally {
      await new Promise((resolve) => setTimeout(resolve, 350));
      setIsUploadingCV(false);
      setAnalysisProgress(0);
    }
  };

  const defaultHeadline = isEmpresa
    ? "Talent Acquisition · Tech LATAM"
    : isFreelancer
      ? "Brand & UI Designer · Top Rated"
      : session?.role === "estudiante"
        ? "Estudiante en formación · Buscando primera oportunidad"
        : "Perfil profesional en desarrollo";
  const defaultBio = isEmpresa
    ? "Empresa líder en LATAM construyendo productos digitales escalables. Buscamos talento curioso, ambicioso y con sensibilidad por el detalle."
    : isFreelancer
      ? "Diseño identidades visuales y experiencias web para startups en LATAM. Trabajo rápido, pulido y con foco en negocio."
      : session?.role === "estudiante"
        ? "Estoy construyendo mi perfil profesional con prácticas, proyectos y mentoría para acelerar mi entrada al mercado laboral."
        : "Completa tu bio con tu experiencia, skills y el tipo de oportunidad que estás buscando.";

  if (isLoading) {
    return <div className="p-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Perfil"
        title="Mi perfil"
        subtitle="Así te ven empresas y otros usuarios en la red."
        action={
          <div className="flex items-center gap-3">
            {isTalentProfile && (
              <button
                onClick={() => cvInput.current?.click()}
                disabled={isUploadingCV}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-primary/20 bg-primary/10 text-primary text-sm font-subtitle font-semibold hover:bg-primary/20 transition-colors disabled:opacity-50"
              >
                {isUploadingCV ? <><Loader2 className="h-4 w-4 animate-spin" /> Analizando IA... {Math.min(analysisProgress, 100)}%</> : <><FileText className="h-4 w-4" /> Importar de CV (IA)</>}
              </button>
            )}
            {isTalentProfile && (
              <button
                onClick={() => improveProfileMutation.mutate()}
                disabled={improveProfileMutation.isPending}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-border bg-card text-sm font-subtitle font-semibold hover:border-foreground disabled:opacity-50"
              >
                {improveProfileMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Analizando perfil...</> : "Sugerencias IA"}
              </button>
            )}
            {pendingAIAnalysis && (
              <>
                <button
                  onClick={applyAIChanges}
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-transparent bg-primary text-primary-foreground text-sm font-subtitle font-semibold hover:bg-primary/90"
                >
                  Aplicar cambios IA
                </button>
                <button
                  onClick={discardAIChanges}
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-border bg-card text-sm font-subtitle font-semibold hover:border-foreground"
                >
                  Descartar
                </button>
              </>
            )}
            {editing ? (
              <button
                onClick={saveProfile}
                disabled={updateProfile.isPending}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-transparent bg-primary text-primary-foreground text-sm font-subtitle font-semibold hover:bg-primary/90"
              >
                {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Guardar</>}
              </button>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-border bg-card text-sm font-subtitle font-semibold hover:border-foreground"
              >
                <Pencil className="h-4 w-4" /> Editar
              </button>
            )}
          </div>
        }
      />

      <input ref={avatarInput} type="file" accept="image/*" hidden onChange={onFile("avatarUrl")} />
      <input ref={coverInput} type="file" accept="image/*" hidden onChange={onFile("coverUrl")} />
      <input ref={cvInput} type="file" accept="application/pdf" hidden onChange={onUploadCV} />
      {isUploadingCV && (
        <section className="mb-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center justify-between text-sm font-subtitle font-semibold text-primary">
            <span>Analizando CV con IA...</span>
            <span>{Math.min(analysisProgress, 100)}%</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-primary/15 overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${Math.min(analysisProgress, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground font-sans">
            Estamos leyendo tu CV y generando recomendaciones. Esto puede tardar unos segundos.
          </p>
        </section>
      )}

      {aiProfileSuggestions.length > 0 && (
        <section className="mb-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-subtitle font-semibold text-primary">Sugerencias IA para mejorar tu perfil</p>
            <button
              type="button"
              onClick={() => setAiProfileSuggestions([])}
              className="text-xs font-subtitle font-semibold text-muted-foreground hover:text-foreground"
            >
              Ocultar
            </button>
          </div>
          <ul className="mt-3 space-y-2">
            {aiProfileSuggestions.map((suggestion, index) => (
              <li key={`${suggestion.field}-${index}`} className="rounded-xl border border-border bg-white p-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-subtitle">{suggestion.field} · impacto {suggestion.impact}</p>
                <p className="text-sm text-foreground mt-1">{suggestion.tip}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="rounded-2xl border border-border bg-card overflow-visible">
        <div className="h-40 relative bg-gradient-to-br from-primary/30 to-primary/5">
          {profile.coverUrl && (
            <img src={profile.coverUrl} alt="Portada" className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card/90 to-transparent" />
          <button
            onClick={() => coverInput.current?.click()}
            className="absolute top-3 right-3 inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-background/90 backdrop-blur text-xs font-subtitle font-semibold border border-border hover:border-foreground"
          >
            <ImageIcon className="h-3.5 w-3.5" /> Cambiar portada
          </button>
        </div>
        <div className="px-6 pb-6 pt-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-5">
            <div className="relative -mt-12 sm:-mt-14">
              <div className="h-24 w-24 rounded-2xl bg-foreground text-background flex items-center justify-center text-xl font-display font-bold border-4 border-card overflow-hidden">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.name || "Avatar"} className="w-full h-full object-cover" />
                ) : (
                  (profile.name || "U").slice(0, 2).toUpperCase()
                )}
              </div>
              <button
                onClick={() => avatarInput.current?.click()}
                aria-label="Cambiar foto"
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-card hover:scale-105 transition-transform"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 min-w-0 pt-1 sm:pt-2">
              {editing ? (
                <input
                  className="w-full max-w-md text-2xl font-display font-bold bg-transparent border-b border-border focus:border-foreground outline-none"
                  placeholder="Tu nombre"
                  value={editForm.name}
                  onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                />
              ) : (
                <h2 className="font-display text-2xl font-bold">{profile.name}</h2>
              )}
              {editing ? (
                <input
                  className="mt-2 w-full max-w-md text-sm bg-transparent border-b border-border focus:border-foreground outline-none font-sans"
                  placeholder="Tu título profesional (ej. Senior Product Designer)"
                  value={editForm.headline}
                  onChange={e => setEditForm(p => ({ ...p, headline: e.target.value }))}
                />
              ) : (
                <p className="mt-1 text-sm text-muted-foreground font-sans">{profile.headline || defaultHeadline}</p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground font-sans">
                {editing ? (
                  <span className="relative flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <input
                      aria-label="Ubicación"
                      className="h-9 w-52 rounded-lg border border-border bg-card px-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                      placeholder="Escribe tu ciudad"
                      value={editForm.location}
                      onFocus={() => setShowLocationSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 120)}
                      onChange={(e) => {
                        setEditForm((p) => ({ ...p, location: e.target.value }));
                        setShowLocationSuggestions(true);
                      }}
                    />
                    {showLocationSuggestions && filteredCities.length > 0 && (
                      <div className="absolute left-0 top-10 z-30 w-64 max-h-64 overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
                        {filteredCities.map((city) => (
                          <button
                            key={city}
                            type="button"
                            onClick={() => {
                              setEditForm((p) => ({ ...p, location: city }));
                              setShowLocationSuggestions(false);
                            }}
                            className="block w-full px-3 py-2 text-left text-xs text-foreground hover:bg-surface-elevated"
                          >
                            {city}
                          </button>
                        ))}
                      </div>
                    )}
                  </span>
                ) : (
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {profile.location || "Ubicación sin especificar"}</span>
                )}
                <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {isEmpresa ? "Empresa" : experienceYears > 0 ? `${experienceYears} años exp.` : "Experiencia no especificada"}</span>
                <span>{profileDataObj.workArea || editForm.workArea || "Área no especificada"}</span>
                {isFreelancer && <span className="flex items-center gap-1"><Star className="h-3 w-3 text-primary fill-primary" /> Nuevo en Joblify</span>}
              </div>

              {editing && (
                <div className="mt-3 max-w-sm">
                  <label className="mb-1 block text-[11px] font-subtitle font-semibold uppercase tracking-wide text-muted-foreground">
                    Área de trabajo
                  </label>
                  <div className="relative">
                    <input
                    aria-label="Área de trabajo"
                    title="Área de trabajo"
                    className="w-full h-10 rounded-lg border border-border bg-card px-3 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:border-primary outline-none"
                    value={editForm.workArea}
                    placeholder="Busca o escribe tu área"
                    onFocus={() => setShowWorkAreaSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowWorkAreaSuggestions(false), 120)}
                    onChange={(e) => {
                      setEditForm((p) => ({ ...p, workArea: e.target.value }));
                      setShowWorkAreaSuggestions(true);
                    }}
                    />
                    {showWorkAreaSuggestions && filteredWorkAreas.length > 0 && (
                      <div className="absolute left-0 top-11 z-30 w-full max-h-64 overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
                        {filteredWorkAreas.map((area) => (
                          <button
                            key={area}
                            type="button"
                            onClick={() => {
                              setEditForm((p) => ({ ...p, workArea: area }));
                              setShowWorkAreaSuggestions(false);
                            }}
                            className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-surface-elevated"
                          >
                            {area}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">Mostrando áreas registradas en la plataforma.</p>
                </div>
              )}
            </div>
            <div className="flex gap-2 sm:pb-1 sm:self-start">
              <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-subtitle font-semibold">
                {isEmpresa ? "Verificada" : isFreelancer ? "Freelancer" : "Open to work"}
              </span>
            </div>
          </div>

          {editing ? (
            <textarea
              className="mt-5 w-full text-sm bg-transparent border border-border rounded-xl p-3 focus:border-foreground outline-none font-sans"
              rows={4}
              placeholder="Escribe tu biografía aquí..."
              value={editForm.bio}
              onChange={e => setEditForm(p => ({ ...p, bio: e.target.value }))}
            />
          ) : (
            <p className="mt-5 text-sm font-sans text-foreground/90 leading-relaxed max-w-3xl whitespace-pre-wrap">
              {profile.bio || defaultBio}
            </p>
          )}
        </div>
      </div>

      {isEmpresa && (
        <section className="mt-6 rounded-2xl border border-border bg-card p-5">
          <h3 className="font-subtitle font-semibold mb-4">Información de la empresa</h3>

          {editing ? (
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <p className="mb-1 text-[11px] font-subtitle font-semibold uppercase tracking-wide text-muted-foreground">Sitio web</p>
                <input
                  className="h-10 w-full rounded-lg border border-border px-3 text-sm"
                  placeholder="https://tuempresa.com"
                  value={editForm.website}
                  onChange={(e) => setEditForm((p) => ({ ...p, website: e.target.value }))}
                />
              </div>
              <div>
                <p className="mb-1 text-[11px] font-subtitle font-semibold uppercase tracking-wide text-muted-foreground">LinkedIn</p>
                <input
                  className="h-10 w-full rounded-lg border border-border px-3 text-sm"
                  placeholder="https://linkedin.com/company/tuempresa"
                  value={editForm.linkedinUrl}
                  onChange={(e) => setEditForm((p) => ({ ...p, linkedinUrl: e.target.value }))}
                />
              </div>
              <div>
                <p className="mb-1 text-[11px] font-subtitle font-semibold uppercase tracking-wide text-muted-foreground">Industria</p>
                <input
                  className="h-10 w-full rounded-lg border border-border px-3 text-sm"
                  placeholder="Ej: Tecnología, Fintech, Salud"
                  value={editForm.industry}
                  onChange={(e) => setEditForm((p) => ({ ...p, industry: e.target.value }))}
                />
              </div>
              <div>
                <p className="mb-1 text-[11px] font-subtitle font-semibold uppercase tracking-wide text-muted-foreground">Tamaño de empresa</p>
                <input
                  className="h-10 w-full rounded-lg border border-border px-3 text-sm"
                  placeholder="Ej: 11-50 colaboradores"
                  value={editForm.companySize}
                  onChange={(e) => setEditForm((p) => ({ ...p, companySize: e.target.value }))}
                />
              </div>
              <div>
                <p className="mb-1 text-[11px] font-subtitle font-semibold uppercase tracking-wide text-muted-foreground">Año de fundación</p>
                <input
                  type="number"
                  min="1900"
                  max="2100"
                  className="h-10 w-full rounded-lg border border-border px-3 text-sm"
                  placeholder="Ej: 2018"
                  value={editForm.foundedYear}
                  onChange={(e) => setEditForm((p) => ({ ...p, foundedYear: e.target.value }))}
                />
              </div>
              <div>
                <p className="mb-1 text-[11px] font-subtitle font-semibold uppercase tracking-wide text-muted-foreground">Tamaño del equipo hiring</p>
                <input
                  className="h-10 w-full rounded-lg border border-border px-3 text-sm"
                  placeholder="Ej: 3 reclutadores"
                  value={editForm.teamSize}
                  onChange={(e) => setEditForm((p) => ({ ...p, teamSize: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <p className="mb-1 text-[11px] font-subtitle font-semibold uppercase tracking-wide text-muted-foreground">Especialidades (coma separada)</p>
                <input
                  className="h-10 w-full rounded-lg border border-border px-3 text-sm"
                  placeholder="Ej: Backend, Data, Producto"
                  value={editForm.specialtiesText}
                  onChange={(e) => setEditForm((p) => ({ ...p, specialtiesText: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <p className="mb-1 text-[11px] font-subtitle font-semibold uppercase tracking-wide text-muted-foreground">Valores culturales (coma separada)</p>
                <input
                  className="h-10 w-full rounded-lg border border-border px-3 text-sm"
                  placeholder="Ej: Ownership, Aprendizaje continuo, Transparencia"
                  value={editForm.cultureValuesText}
                  onChange={(e) => setEditForm((p) => ({ ...p, cultureValuesText: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <p className="mb-1 text-[11px] font-subtitle font-semibold uppercase tracking-wide text-muted-foreground">Beneficios (coma separada)</p>
                <input
                  className="h-10 w-full rounded-lg border border-border px-3 text-sm"
                  placeholder="Ej: Trabajo remoto, Seguro médico, Horario flexible"
                  value={editForm.benefitsText}
                  onChange={(e) => setEditForm((p) => ({ ...p, benefitsText: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <p className="mb-1 text-[11px] font-subtitle font-semibold uppercase tracking-wide text-muted-foreground">Descripción corta de la empresa</p>
                <textarea
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  rows={3}
                  placeholder="Qué construyen, para quién, y por qué unirte"
                  value={editForm.companyOverview}
                  onChange={(e) => setEditForm((p) => ({ ...p, companyOverview: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <p className="mb-1 text-[11px] font-subtitle font-semibold uppercase tracking-wide text-muted-foreground">Email de contratación</p>
                <input
                  type="email"
                  className="h-10 w-full rounded-lg border border-border px-3 text-sm"
                  placeholder="talento@tuempresa.com"
                  value={editForm.hiringEmail}
                  onChange={(e) => setEditForm((p) => ({ ...p, hiringEmail: e.target.value }))}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm font-sans">
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {editForm.industry && <span className="px-2 py-1 rounded-full bg-surface-elevated border border-border">{editForm.industry}</span>}
                {editForm.companySize && <span className="px-2 py-1 rounded-full bg-surface-elevated border border-border">{editForm.companySize}</span>}
                {editForm.foundedYear && <span className="px-2 py-1 rounded-full bg-surface-elevated border border-border">Fundada en {editForm.foundedYear}</span>}
              </div>
              <p className="text-foreground/90">{editForm.companyOverview || "Completa la información de empresa para fortalecer tu marca empleadora."}</p>
              <div className="text-xs text-muted-foreground">
                {editForm.website && <p>Sitio: {editForm.website}</p>}
                {editForm.linkedinUrl && <p>LinkedIn: {editForm.linkedinUrl}</p>}
                {editForm.hiringEmail && <p>Email hiring: {editForm.hiringEmail}</p>}
                {editForm.cultureValuesText && <p>Cultura: {editForm.cultureValuesText}</p>}
                {editForm.benefitsText && <p>Beneficios: {editForm.benefitsText}</p>}
              </div>
            </div>
          )}
        </section>
      )}

      <div className="mt-6 grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          {/* Si el perfil fue rellenado por IA y tiene recommendation, la mostramos como feedback */}
          {recommendation && (
            <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/20 rounded-lg shrink-0">
                  <Star className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-subtitle font-semibold text-primary">Análisis de la Inteligencia Artificial</h3>
                  <p className="mt-1 text-sm text-foreground/80 leading-relaxed font-sans">
                    {recommendation}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Habilidades generadas o manuales */}
          {skills && skills.length > 0 && (
            <section className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-subtitle font-semibold mb-4">Habilidades destacadas</h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill: string, idx: number) => (
                  <span key={idx} className="px-3 py-1.5 bg-surface-elevated border border-border rounded-lg text-sm font-sans font-medium text-foreground">
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-subtitle font-semibold">{isEmpresa ? "Vacantes activas" : "Experiencia"}</h3>
              <button
                onClick={() => setIsAddingExperience((prev) => !prev)}
                className="text-xs font-subtitle font-semibold inline-flex items-center gap-1 hover:text-primary"
              >
                <Plus className="h-3 w-3" /> Agregar
              </button>
            </div>

            {isAddingExperience && (
              <div className="mb-4 grid gap-3 rounded-xl border border-border p-4">
                <div>
                  <p className="mb-1 text-[11px] font-subtitle font-semibold uppercase tracking-wide text-muted-foreground">¿Cuál era tu cargo?</p>
                  <input className="h-10 w-full rounded-lg border border-border px-3 text-sm" placeholder="Ej: Frontend Developer" value={newExperience.title} onChange={(e) => setNewExperience((p) => ({ ...p, title: e.target.value }))} />
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-subtitle font-semibold uppercase tracking-wide text-muted-foreground">¿Dónde empezaste a trabajar?</p>
                  <input className="h-10 w-full rounded-lg border border-border px-3 text-sm" placeholder="Ej: Rappi, Globant, Bancolombia" value={newExperience.company} onChange={(e) => setNewExperience((p) => ({ ...p, company: e.target.value }))} />
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-subtitle font-semibold uppercase tracking-wide text-muted-foreground">Ubicación</p>
                  <input className="h-10 w-full rounded-lg border border-border px-3 text-sm bg-card text-foreground placeholder:text-muted-foreground" placeholder="Ej: Medellín, Colombia" value={newExperience.location} onChange={(e) => setNewExperience((p) => ({ ...p, location: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" aria-label="Fecha de inicio" title="Fecha de inicio" className="h-10 rounded-lg border border-border px-3 text-sm" value={newExperience.startDate} onChange={(e) => setNewExperience((p) => ({ ...p, startDate: e.target.value }))} />
                  <input type="date" aria-label="Fecha de fin" title="Fecha de fin" className="h-10 rounded-lg border border-border px-3 text-sm" value={newExperience.endDate} onChange={(e) => setNewExperience((p) => ({ ...p, endDate: e.target.value }))} disabled={newExperience.current} />
                </div>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input type="checkbox" checked={newExperience.current} onChange={(e) => setNewExperience((p) => ({ ...p, current: e.target.checked }))} />
                  Trabajo actual
                </label>
                <div>
                  <p className="mb-1 text-[11px] font-subtitle font-semibold uppercase tracking-wide text-muted-foreground">¿Qué hacías en ese rol?</p>
                  <textarea className="w-full rounded-lg border border-border px-3 py-2 text-sm" rows={3} placeholder="Ej: Construí componentes, mejoré performance del dashboard y colaboré con diseño y backend." value={newExperience.description} onChange={(e) => setNewExperience((p) => ({ ...p, description: e.target.value }))} />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => addExperienceMutation.mutate(newExperience)}
                    disabled={addExperienceMutation.isPending || !newExperience.title || !newExperience.company || !newExperience.startDate}
                    className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50"
                  >
                    Guardar experiencia
                  </button>
                  <button
                    onClick={() => setIsAddingExperience(false)}
                    className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-border text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            <ul className="space-y-4">
              {experiences.length === 0 && (
                <li className="text-sm text-muted-foreground">Aún no has agregado experiencia real.</li>
              )}
              {experiences.map((x: { id: string; title: string; company: string; location?: string; description?: string; startDate?: string; endDate?: string; current?: boolean }) => (
                <li key={x.id} className="space-y-3">
                  <div className="flex gap-4">
                    <div className="h-10 w-10 rounded-lg bg-surface-elevated flex items-center justify-center shrink-0">
                      <Briefcase className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-subtitle font-semibold">{x.title}</p>
                      <p className="text-xs text-muted-foreground font-sans">{x.company}</p>
                      <p className="text-[11px] text-muted-foreground font-sans mt-0.5">
                        {formatExperienceDate(x.startDate)} — {x.current ? "Hoy" : formatExperienceDate(x.endDate) || "Actual"}
                      </p>
                      {x.location && (
                        <p className="text-[11px] text-muted-foreground font-sans mt-0.5">{x.location}</p>
                      )}
                      {x.description && (
                        <p className="text-xs text-foreground/80 font-sans mt-1 leading-relaxed whitespace-pre-wrap">{x.description}</p>
                      )}
                    </div>
                    {editing && (
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          onClick={() => startEditExperience(x)}
                          className="h-8 px-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteExperienceMutation.mutate(x.id)}
                          disabled={deleteExperienceMutation.isPending}
                          className="h-8 px-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground disabled:opacity-50"
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>

                  {editing && editingExperienceId === x.id && (
                    <div className="ml-14 grid gap-2 rounded-xl border border-border p-3">
                      <div>
                        <p className="mb-1 text-[11px] font-subtitle font-semibold uppercase tracking-wide text-muted-foreground">Cargo</p>
                        <input
                          className="h-9 w-full rounded-lg border border-border px-3 text-sm"
                          placeholder="Ej: Product Designer"
                          value={editExperienceForm.title}
                          onChange={(e) => setEditExperienceForm((p) => ({ ...p, title: e.target.value }))}
                        />
                      </div>
                      <div>
                        <p className="mb-1 text-[11px] font-subtitle font-semibold uppercase tracking-wide text-muted-foreground">Empresa</p>
                        <input
                          className="h-9 w-full rounded-lg border border-border px-3 text-sm"
                          placeholder="Ej: Mercado Libre"
                          value={editExperienceForm.company}
                          onChange={(e) => setEditExperienceForm((p) => ({ ...p, company: e.target.value }))}
                        />
                      </div>
                      <div>
                        <p className="mb-1 text-[11px] font-subtitle font-semibold uppercase tracking-wide text-muted-foreground">Ubicación</p>
                        <input
                          className="h-9 w-full rounded-lg border border-border px-3 text-sm"
                          placeholder="Ej: Bogotá, Colombia"
                          value={editExperienceForm.location}
                          onChange={(e) => setEditExperienceForm((p) => ({ ...p, location: e.target.value }))}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          aria-label="Fecha de inicio"
                          title="Fecha de inicio"
                          className="h-9 rounded-lg border border-border px-3 text-sm"
                          value={editExperienceForm.startDate}
                          onChange={(e) => setEditExperienceForm((p) => ({ ...p, startDate: e.target.value }))}
                        />
                        <input
                          type="date"
                          aria-label="Fecha de fin"
                          title="Fecha de fin"
                          className="h-9 rounded-lg border border-border px-3 text-sm"
                          value={editExperienceForm.endDate}
                          onChange={(e) => setEditExperienceForm((p) => ({ ...p, endDate: e.target.value }))}
                          disabled={editExperienceForm.current}
                        />
                      </div>
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={editExperienceForm.current}
                          onChange={(e) => setEditExperienceForm((p) => ({ ...p, current: e.target.checked }))}
                        />
                        Trabajo actual
                      </label>
                      <div>
                        <p className="mb-1 text-[11px] font-subtitle font-semibold uppercase tracking-wide text-muted-foreground">Descripción del rol</p>
                        <textarea
                          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                          rows={2}
                          placeholder="Cuenta brevemente qué lograste en ese puesto"
                          value={editExperienceForm.description}
                          onChange={(e) => setEditExperienceForm((p) => ({ ...p, description: e.target.value }))}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={saveEditedExperience}
                          disabled={updateExperienceMutation.isPending}
                          className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50"
                        >
                          Guardar cambios
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingExperienceId(null)}
                          className="h-8 px-3 rounded-lg border border-border text-xs font-semibold"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-subtitle font-semibold mb-4">{isFreelancer ? "Reseñas" : "Skills"}</h3>
            {isFreelancer ? (
              <div>
                {freelancerReviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aún no tienes reseñas de clientes.</p>
                ) : (
                  <ul className="space-y-4">
                    {freelancerReviews.map((review) => (
                      <li key={review.id} className="border border-border rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-subtitle font-semibold">
                            {review.project?.client?.name || review.reviewer?.name || "Cliente"}
                          </p>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: Math.max(1, Math.min(5, Math.round(review.rating || 0))) }).map((_, i) => (
                              <Star key={i} className="h-3 w-3 text-primary fill-primary" />
                            ))}
                          </div>
                        </div>
                        {review.project?.title && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 font-sans">Proyecto: {review.project.title}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1 font-sans">
                          {review.comment || "Cliente satisfecho con el trabajo entregado."}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <div>
                {editing && (
                  <div className="mb-3 flex gap-2">
                    <input
                      className="h-10 flex-1 rounded-lg border border-border px-3 text-sm"
                      placeholder="Escribe una habilidad y presiona Enter"
                      value={skillDraft}
                      onChange={(e) => setSkillDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSkillChip();
                        }
                      }}
                    />
                    <button onClick={addSkillChip} className="h-10 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">Agregar</button>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {manualSkills.map((s) => (
                    <span key={s} className="text-xs font-subtitle font-medium px-3 py-1.5 rounded-full bg-surface-elevated inline-flex items-center gap-2">
                      {s}
                      {editing && (
                        <button onClick={() => removeSkillChip(s)} className="text-muted-foreground hover:text-foreground">×</button>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {isFreelancer && (
            <section className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-subtitle font-semibold">Servicios freelance</h3>
                {editing && (
                  <button
                    type="button"
                    onClick={() => setIsAddingService((prev) => !prev)}
                    className="h-8 px-3 rounded-lg border border-border text-xs font-semibold"
                  >
                    {isAddingService ? "Cerrar" : "Agregar servicio"}
                  </button>
                )}
              </div>

              {isAddingService && (
                <div className="mb-4 grid gap-2 rounded-xl border border-border p-3">
                  <input className="h-9 rounded-lg border border-border px-3 text-sm" placeholder="Título del servicio" value={newServiceForm.title} onChange={(e) => setNewServiceForm((p) => ({ ...p, title: e.target.value }))} />
                  <input className="h-9 rounded-lg border border-border px-3 text-sm" placeholder="Categoría" value={newServiceForm.category} onChange={(e) => setNewServiceForm((p) => ({ ...p, category: e.target.value }))} />
                  <textarea className="rounded-lg border border-border px-3 py-2 text-sm" rows={2} placeholder="Descripción del servicio" value={newServiceForm.description} onChange={(e) => setNewServiceForm((p) => ({ ...p, description: e.target.value }))} />
                  <div className="grid grid-cols-3 gap-2">
                    <input className="h-9 rounded-lg border border-border px-3 text-sm" placeholder="Precio base" value={newServiceForm.priceMin} onChange={(e) => setNewServiceForm((p) => ({ ...p, priceMin: e.target.value }))} />
                    <input className="h-9 rounded-lg border border-border px-3 text-sm" placeholder="Precio máximo" value={newServiceForm.priceMax} onChange={(e) => setNewServiceForm((p) => ({ ...p, priceMax: e.target.value }))} />
                    <input className="h-9 rounded-lg border border-border px-3 text-sm" placeholder="Entrega (días)" value={newServiceForm.deliveryDays} onChange={(e) => setNewServiceForm((p) => ({ ...p, deliveryDays: e.target.value }))} />
                  </div>
                  <textarea className="rounded-lg border border-border px-3 py-2 text-sm" rows={2} placeholder="Links de portafolio (uno por línea o separados por coma)" value={newServiceForm.portfolioText} onChange={(e) => setNewServiceForm((p) => ({ ...p, portfolioText: e.target.value }))} />
                  <div className="flex gap-2">
                    <button type="button" onClick={saveNewService} disabled={createServiceMutation.isPending} className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50">Guardar servicio</button>
                    <button type="button" onClick={() => setIsAddingService(false)} className="h-8 px-3 rounded-lg border border-border text-xs font-semibold">Cancelar</button>
                  </div>
                </div>
              )}

              {freelancerServices.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-4">
                  <p className="text-sm text-muted-foreground">Aún no has creado servicios.</p>
                  {!editing && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <p className="text-xs text-muted-foreground">Para crear servicios, primero entra en modo edición.</p>
                      <button
                        type="button"
                        onClick={() => setEditing(true)}
                        className="h-8 px-3 rounded-lg border border-border text-xs font-semibold"
                      >
                        Editar perfil
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <ul className="space-y-3">
                  {freelancerServices.map((service) => (
                    <li key={service.id} className="rounded-xl border border-border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-subtitle font-semibold">{service.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{service.category}</p>
                          <p className="mt-2 text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">{service.description}</p>
                          <p className="mt-2 text-[11px] text-muted-foreground">
                            {service.currency} {service.priceMin}{service.priceMax ? ` - ${service.priceMax}` : ""} · Entrega en {service.deliveryDays} días
                          </p>
                        </div>
                        {editing && (
                          <div className="flex gap-2">
                            <button type="button" onClick={() => startEditService(service)} className="h-8 px-2 rounded-lg border border-border text-xs">Editar</button>
                            <button type="button" onClick={() => deleteServiceMutation.mutate(service.id)} disabled={deleteServiceMutation.isPending} className="h-8 px-2 rounded-lg border border-border text-xs disabled:opacity-50">Eliminar</button>
                          </div>
                        )}
                      </div>

                      {editing && editingServiceId === service.id && (
                        <div className="mt-3 grid gap-2 rounded-lg border border-border p-3">
                          <input className="h-9 rounded-lg border border-border px-3 text-sm" placeholder="Título del servicio" value={editServiceForm.title} onChange={(e) => setEditServiceForm((p) => ({ ...p, title: e.target.value }))} />
                          <input className="h-9 rounded-lg border border-border px-3 text-sm" placeholder="Categoría" value={editServiceForm.category} onChange={(e) => setEditServiceForm((p) => ({ ...p, category: e.target.value }))} />
                          <textarea className="rounded-lg border border-border px-3 py-2 text-sm" rows={2} placeholder="Descripción" value={editServiceForm.description} onChange={(e) => setEditServiceForm((p) => ({ ...p, description: e.target.value }))} />
                          <div className="grid grid-cols-3 gap-2">
                            <input className="h-9 rounded-lg border border-border px-3 text-sm" placeholder="Precio base" value={editServiceForm.priceMin} onChange={(e) => setEditServiceForm((p) => ({ ...p, priceMin: e.target.value }))} />
                            <input className="h-9 rounded-lg border border-border px-3 text-sm" placeholder="Precio máximo" value={editServiceForm.priceMax} onChange={(e) => setEditServiceForm((p) => ({ ...p, priceMax: e.target.value }))} />
                            <input className="h-9 rounded-lg border border-border px-3 text-sm" placeholder="Entrega (días)" value={editServiceForm.deliveryDays} onChange={(e) => setEditServiceForm((p) => ({ ...p, deliveryDays: e.target.value }))} />
                          </div>
                          <textarea className="rounded-lg border border-border px-3 py-2 text-sm" rows={2} placeholder="Links de portafolio" value={editServiceForm.portfolioText} onChange={(e) => setEditServiceForm((p) => ({ ...p, portfolioText: e.target.value }))} />
                          <div className="flex gap-2">
                            <button type="button" onClick={saveEditedService} disabled={updateServiceMutation.isPending} className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50">Guardar cambios</button>
                            <button type="button" onClick={() => setEditingServiceId(null)} className="h-8 px-3 rounded-lg border border-border text-xs font-semibold">Cancelar</button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {isFreelancer && (
            <section className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-subtitle font-semibold mb-4">Portafolio de trabajos</h3>
              {freelancerPortfolioItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-4">
                  <p className="text-sm text-muted-foreground">Aún no has agregado enlaces de portafolio en tus servicios.</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    El portafolio se construye desde cada servicio en el campo “Links de portafolio”.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {freelancerPortfolioItems.map((item) => (
                    <a
                      key={item}
                      href={item}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-border p-3 text-sm text-primary hover:border-primary transition-colors break-all"
                    >
                      {item}
                    </a>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Match score</p>
            <p className="mt-2 font-display text-4xl font-bold text-primary">{safeMatchScore}%</p>
            <p className="text-xs text-muted-foreground font-sans mt-1">
              {safeMatchScore >= 80
                ? "Tu perfil está optimizado."
                : safeMatchScore >= 60
                  ? "Tu perfil va bien; aún puedes mejorarlo."
                  : "Completa más secciones para mejorar tu score."}
            </p>
          </section>
          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Award className="h-4 w-4 text-primary" />
              <p className="text-sm font-subtitle font-semibold">Logros</p>
            </div>
            <ul className="space-y-2 text-xs font-sans text-muted-foreground">
              <li>{profileStats?.isVerified ? "✓" : "•"} {profileStats?.isVerified ? "Perfil verificado" : "Perfil pendiente de verificación"}</li>
              <li>{connectionsCount >= 100 ? "✓" : "•"} {connectionsCount} conexiones en la red</li>
              <li>{safeMatchScore >= 80 ? "✓" : "•"} {safeMatchScore >= 80 ? "Perfil altamente competitivo" : "Sigue optimizando tu perfil"}</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default ProfilePage;
