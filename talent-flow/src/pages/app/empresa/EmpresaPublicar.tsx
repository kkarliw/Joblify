import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { Loader2, Sparkles } from "lucide-react";
import { aiApi, jobsApi } from "@/lib/api";
import { toast } from "sonner";

type JobModality = "REMOTO" | "HIBRIDO" | "PRESENCIAL";
type JobType = "FULL_TIME" | "PART_TIME" | "FREELANCE" | "PASANTIA";
type AiMode = "prompt" | "guided";

type AiDraft = {
  title: string;
  description: string;
  requirements: string;
  benefits: string;
  location: string;
  modality: JobModality;
  type: JobType;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  skills: string[];
  screeningQuestions: string[];
};

type JobItem = {
  id: string;
  title: string;
  description?: string;
  requirements?: string;
  benefits?: string;
  location?: string;
  modality?: JobModality;
  type?: JobType;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string;
  skills?: Array<{ skill?: { name?: string } }>;
};

const modalityOptions: Array<{ value: JobModality; label: string }> = [
  { value: "REMOTO", label: "Remoto" },
  { value: "HIBRIDO", label: "Híbrido" },
  { value: "PRESENCIAL", label: "Presencial" },
];

const typeOptions: Array<{ value: JobType; label: string }> = [
  { value: "FULL_TIME", label: "Tiempo completo" },
  { value: "PART_TIME", label: "Medio tiempo" },
  { value: "FREELANCE", label: "Freelance" },
  { value: "PASANTIA", label: "Pasantía" },
];

const parseSkills = (value: string) =>
  Array.from(
    new Set(
      value
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean)
    )
  );

const parseCsvList = (value: string) =>
  Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );

const toNumberOrUndefined = (value: string) => {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const EmpresaPublicar = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const editJobId = searchParams.get("edit");
  const isEditMode = Boolean(editJobId);
  const [hydratedEditId, setHydratedEditId] = useState<string | null>(null);
  const [aiMode, setAiMode] = useState<AiMode>("prompt");
  const [aiSource, setAiSource] = useState<"ai" | "fallback" | null>(null);
  const [screeningQuestions, setScreeningQuestions] = useState<string[]>([]);
  const [promptText, setPromptText] = useState("");
  const [guided, setGuided] = useState({
    roleTitle: "",
    seniority: "",
    industry: "",
    modality: "REMOTO" as JobModality,
    contractType: "FULL_TIME" as JobType,
    location: "",
    responsibilities: "",
    mustHaveSkills: "",
    niceToHaveSkills: "",
    englishLevel: "",
    minSalary: "",
    maxSalary: "",
    currency: "USD",
  });

  const [form, setForm] = useState({
    title: "",
    location: "",
    modality: "REMOTO" as JobModality,
    type: "FULL_TIME" as JobType,
    description: "",
    requirements: "",
    benefits: "",
    salaryMin: "",
    salaryMax: "",
    salaryCurrency: "USD",
    skills: "",
  });

  const parsedSkills = useMemo(() => parseSkills(form.skills), [form.skills]);

  const { data: editableJobs = [], isLoading: loadingEditableJobs } = useQuery<JobItem[]>({
    queryKey: ["empresa", "vacantes", "my", "edit"],
    queryFn: () => jobsApi.myPosted().then((r) => (Array.isArray(r.data) ? (r.data as JobItem[]) : [])),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (!isEditMode || !editJobId || loadingEditableJobs) return;

    const jobToEdit = editableJobs.find((job) => job.id === editJobId);
    if (!jobToEdit) {
      toast.error("No encontramos la vacante para editar");
      navigate("/app/empresa/vacantes", { replace: true });
      return;
    }

    if (hydratedEditId === editJobId) return;

    const skillsText = Array.isArray(jobToEdit.skills)
      ? jobToEdit.skills
          .map((item) => item?.skill?.name)
          .filter((name): name is string => typeof name === "string" && Boolean(name.trim()))
          .join(", ")
      : "";

    setForm({
      title: jobToEdit.title || "",
      location: jobToEdit.location || "",
      modality: jobToEdit.modality || "REMOTO",
      type: jobToEdit.type || "FULL_TIME",
      description: jobToEdit.description || "",
      requirements: jobToEdit.requirements || "",
      benefits: jobToEdit.benefits || "",
      salaryMin: typeof jobToEdit.salaryMin === "number" ? String(jobToEdit.salaryMin) : "",
      salaryMax: typeof jobToEdit.salaryMax === "number" ? String(jobToEdit.salaryMax) : "",
      salaryCurrency: jobToEdit.salaryCurrency || "USD",
      skills: skillsText,
    });

    setHydratedEditId(editJobId);
  }, [isEditMode, editJobId, loadingEditableJobs, editableJobs, hydratedEditId, navigate]);

  const applyDraftToForm = (draft: AiDraft) => {
    setForm((prev) => ({
      ...prev,
      title: draft.title || prev.title,
      location: draft.location || prev.location,
      modality: draft.modality || prev.modality,
      type: draft.type || prev.type,
      description: draft.description || prev.description,
      requirements: draft.requirements || prev.requirements,
      benefits: draft.benefits || prev.benefits,
      salaryMin: typeof draft.salaryMin === "number" ? String(draft.salaryMin) : "",
      salaryMax: typeof draft.salaryMax === "number" ? String(draft.salaryMax) : "",
      salaryCurrency: draft.salaryCurrency || prev.salaryCurrency,
      skills: draft.skills?.length ? draft.skills.join(", ") : prev.skills,
    }));

    setScreeningQuestions(draft.screeningQuestions || []);
  };

  const generateDraft = useMutation({
    mutationFn: async () => {
      if (aiMode === "prompt") {
        if (promptText.trim().length < 10) {
          throw new Error("Describe la vacante con al menos 10 caracteres para generar el borrador");
        }

        return aiApi.generateJobDraft({ prompt: promptText.trim() });
      }

      const mustHave = parseCsvList(guided.mustHaveSkills);
      const niceToHave = parseCsvList(guided.niceToHaveSkills);
      const minSalary = toNumberOrUndefined(guided.minSalary);
      const maxSalary = toNumberOrUndefined(guided.maxSalary);

      if (!guided.roleTitle.trim() && !guided.responsibilities.trim()) {
        throw new Error("Completa al menos el cargo o responsabilidades para generar el borrador");
      }

      return aiApi.generateJobDraft({
        brief: {
          roleTitle: guided.roleTitle.trim() || undefined,
          seniority: guided.seniority.trim() || undefined,
          industry: guided.industry.trim() || undefined,
          modality: guided.modality,
          contractType: guided.contractType,
          location: guided.location.trim() || undefined,
          responsibilities: guided.responsibilities.trim() || undefined,
          mustHaveSkills: mustHave.length ? mustHave : undefined,
          niceToHaveSkills: niceToHave.length ? niceToHave : undefined,
          englishLevel: guided.englishLevel.trim() || undefined,
          minSalary,
          maxSalary,
          currency: guided.currency.trim() || undefined,
        },
      });
    },
    onSuccess: (response) => {
      const payload = response.data as { source: "ai" | "fallback"; draft: AiDraft };
      applyDraftToForm(payload.draft);
      setAiSource(payload.source);
      toast.success(payload.source === "ai" ? "Borrador generado con IA" : "Generamos un borrador base para que lo ajustes");
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error ||
        (error as { message?: string })?.message ||
        "No se pudo generar el borrador IA";
      toast.error(message);
    },
  });

  const saveJob = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        requirements: form.requirements.trim() || undefined,
        benefits: form.benefits.trim() || undefined,
        location: form.location.trim(),
        modality: form.modality,
        type: form.type,
        salaryMin: toNumberOrUndefined(form.salaryMin),
        salaryMax: toNumberOrUndefined(form.salaryMax),
        salaryCurrency: form.salaryCurrency.trim() || "USD",
        skills: parsedSkills.length > 0 ? parsedSkills : undefined,
      };

      if (isEditMode && editJobId) {
        return jobsApi.update(editJobId, payload);
      }

      return jobsApi.create(payload);
    },
    onSuccess: () => {
      toast.success(isEditMode ? "Vacante actualizada correctamente" : "Vacante publicada correctamente");
      queryClient.invalidateQueries({ queryKey: ["empresa", "vacantes", "my"] });
      queryClient.invalidateQueries({ queryKey: ["empresa", "vacantes", "my", "edit"] });
      queryClient.invalidateQueries({ queryKey: ["jobs", "public"] });
      navigate("/app/empresa/vacantes", { replace: true });
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        (isEditMode ? "No se pudo actualizar la vacante" : "No se pudo publicar la vacante");
      toast.error(message);
    },
  });

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast.error("Ingresa un título para la vacante");
      return;
    }

    if (!form.description.trim() || form.description.trim().length < 20) {
      toast.error("La descripción debe tener al menos 20 caracteres");
      return;
    }

    if (!form.location.trim()) {
      toast.error("Ingresa una ubicación");
      return;
    }

    const min = toNumberOrUndefined(form.salaryMin);
    const max = toNumberOrUndefined(form.salaryMax);
    if (min !== undefined && max !== undefined && min > max) {
      toast.error("El salario mínimo no puede ser mayor al máximo");
      return;
    }

    saveJob.mutate();
  };

  const updateGuided = (key: keyof typeof guided, value: string) => {
    setGuided((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div>
      <PageHeader
        eyebrow={isEditMode ? "Editar vacante" : "Nueva vacante"}
        title={isEditMode ? "Editar oferta" : "Publicar oferta"}
        subtitle={isEditMode ? "Actualiza la información de tu vacante y guarda los cambios." : "Describe lo que necesitas y la IA te ayuda a crear un borrador editable antes de publicar."}
      />

      {isEditMode && loadingEditableJobs ? (
        <div className="rounded-2xl border border-border bg-card p-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando datos de la vacante...
        </div>
      ) : (

      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 mb-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-subtitle font-semibold uppercase tracking-wider text-primary">Asistente IA para reclutamiento</p>
                <p className="mt-1 text-sm font-sans text-foreground/90">
                  Genera el borrador de tu vacante con un prompt libre o con preguntas guiadas.
                </p>
              </div>
              <Sparkles className="h-5 w-5 text-primary" />
            </div>

            <div className="mt-4 inline-flex rounded-full bg-surface-elevated p-1">
              <button
                type="button"
                onClick={() => setAiMode("prompt")}
                className={`h-9 px-4 rounded-full text-xs font-subtitle font-semibold transition ${
                  aiMode === "prompt" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Prompt rápido
              </button>
              <button
                type="button"
                onClick={() => setAiMode("guided")}
                className={`h-9 px-4 rounded-full text-xs font-subtitle font-semibold transition ${
                  aiMode === "guided" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Formulario guiado
              </button>
            </div>

            {aiMode === "prompt" ? (
              <div className="mt-4">
                <label htmlFor="job-ai-prompt" className="text-xs font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">
                  Describe la vacante
                </label>
                <textarea
                  id="job-ai-prompt"
                  rows={4}
                  value={promptText}
                  onChange={(event) => setPromptText(event.target.value)}
                  placeholder="Ej: Necesito un Frontend Developer con React, HTML y CSS para ecommerce B2C, modalidad híbrida en Bogotá, mínimo 3 años de experiencia..."
                  className="mt-1.5 w-full p-3 rounded-xl bg-card text-sm font-sans border border-primary/20 focus:outline-none resize-none"
                />
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="guided-role-title" className="text-xs font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Cargo</label>
                    <input
                      id="guided-role-title"
                      value={guided.roleTitle}
                      onChange={(event) => updateGuided("roleTitle", event.target.value)}
                      placeholder="Frontend Developer"
                      className="mt-1.5 w-full h-11 px-3 rounded-xl bg-card text-sm border border-primary/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="guided-seniority" className="text-xs font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Seniority</label>
                    <input
                      id="guided-seniority"
                      value={guided.seniority}
                      onChange={(event) => updateGuided("seniority", event.target.value)}
                      placeholder="Semi Senior"
                      className="mt-1.5 w-full h-11 px-3 rounded-xl bg-card text-sm border border-primary/20 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="guided-industry" className="text-xs font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Industria</label>
                    <input
                      id="guided-industry"
                      value={guided.industry}
                      onChange={(event) => updateGuided("industry", event.target.value)}
                      placeholder="Ecommerce"
                      className="mt-1.5 w-full h-11 px-3 rounded-xl bg-card text-sm border border-primary/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="guided-location" className="text-xs font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Ubicación</label>
                    <input
                      id="guided-location"
                      value={guided.location}
                      onChange={(event) => updateGuided("location", event.target.value)}
                      placeholder="Bogotá, Colombia"
                      className="mt-1.5 w-full h-11 px-3 rounded-xl bg-card text-sm border border-primary/20 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="guided-modality" className="text-xs font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Modalidad</label>
                    <select
                      id="guided-modality"
                      value={guided.modality}
                      onChange={(event) => updateGuided("modality", event.target.value)}
                      className="mt-1.5 w-full h-11 px-3 rounded-xl bg-card text-sm border border-primary/20 focus:outline-none"
                    >
                      {modalityOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="guided-contract" className="text-xs font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Tipo de contrato</label>
                    <select
                      id="guided-contract"
                      value={guided.contractType}
                      onChange={(event) => updateGuided("contractType", event.target.value)}
                      className="mt-1.5 w-full h-11 px-3 rounded-xl bg-card text-sm border border-primary/20 focus:outline-none"
                    >
                      {typeOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="guided-responsibilities" className="text-xs font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Responsabilidades</label>
                  <textarea
                    id="guided-responsibilities"
                    rows={3}
                    value={guided.responsibilities}
                    onChange={(event) => updateGuided("responsibilities", event.target.value)}
                    placeholder="Qué entregables tendrá, con quién colabora y qué impacto esperas"
                    className="mt-1.5 w-full p-3 rounded-xl bg-card text-sm border border-primary/20 focus:outline-none resize-none"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="guided-must" className="text-xs font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Skills obligatorias</label>
                    <input
                      id="guided-must"
                      value={guided.mustHaveSkills}
                      onChange={(event) => updateGuided("mustHaveSkills", event.target.value)}
                      placeholder="React, HTML, CSS"
                      className="mt-1.5 w-full h-11 px-3 rounded-xl bg-card text-sm border border-primary/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="guided-nice" className="text-xs font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Skills deseables</label>
                    <input
                      id="guided-nice"
                      value={guided.niceToHaveSkills}
                      onChange={(event) => updateGuided("niceToHaveSkills", event.target.value)}
                      placeholder="Next.js, Testing Library"
                      className="mt-1.5 w-full h-11 px-3 rounded-xl bg-card text-sm border border-primary/20 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <label htmlFor="guided-english" className="text-xs font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Nivel de inglés</label>
                    <input
                      id="guided-english"
                      value={guided.englishLevel}
                      onChange={(event) => updateGuided("englishLevel", event.target.value)}
                      placeholder="B2 deseable"
                      className="mt-1.5 w-full h-11 px-3 rounded-xl bg-card text-sm border border-primary/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="guided-salary-min" className="text-xs font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Salario min</label>
                    <input
                      id="guided-salary-min"
                      type="number"
                      value={guided.minSalary}
                      onChange={(event) => updateGuided("minSalary", event.target.value)}
                      className="mt-1.5 w-full h-11 px-3 rounded-xl bg-card text-sm border border-primary/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="guided-salary-max" className="text-xs font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Salario max</label>
                    <input
                      id="guided-salary-max"
                      type="number"
                      value={guided.maxSalary}
                      onChange={(event) => updateGuided("maxSalary", event.target.value)}
                      className="mt-1.5 w-full h-11 px-3 rounded-xl bg-card text-sm border border-primary/20 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => generateDraft.mutate()}
                disabled={generateDraft.isPending}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-subtitle font-semibold hover:bg-primary-hover disabled:opacity-60"
              >
                {generateDraft.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Generando borrador...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Generar borrador IA
                  </>
                )}
              </button>
            </div>

            {aiSource && (
              <p className="mt-3 text-xs text-muted-foreground font-sans">
                Fuente del último borrador: <span className="font-subtitle font-semibold text-foreground">{aiSource === "ai" ? "IA" : "Fallback asistido"}</span>. Revisa y ajusta antes de publicar.
              </p>
            )}
          </div>

          {screeningQuestions.length > 0 && (
            <div className="rounded-2xl border border-border bg-surface-elevated p-4 mb-6">
              <p className="text-xs font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Preguntas sugeridas por IA</p>
              <ul className="mt-3 space-y-2 text-sm font-sans text-foreground/90">
                {screeningQuestions.map((question, index) => (
                  <li key={`${question}-${index}`} className="leading-relaxed">{index + 1}. {question}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="job-title" className="text-xs font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Título</label>
              <input
                id="job-title"
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
                placeholder="Senior Product Designer"
                className="mt-1.5 w-full h-11 px-3 rounded-xl bg-surface-elevated text-sm font-sans focus:outline-none focus:bg-card focus:border-foreground border border-transparent"
              />
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="job-modality" className="text-xs font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Modalidad</label>
                <select
                  id="job-modality"
                  aria-label="Modalidad"
                  title="Modalidad"
                  value={form.modality}
                  onChange={(event) => updateField("modality", event.target.value)}
                  className="mt-1.5 w-full h-11 px-3 rounded-xl bg-surface-elevated text-sm font-sans border border-transparent focus:outline-none"
                >
                  {modalityOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="job-type" className="text-xs font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Tipo</label>
                <select
                  id="job-type"
                  aria-label="Tipo"
                  title="Tipo"
                  value={form.type}
                  onChange={(event) => updateField("type", event.target.value)}
                  className="mt-1.5 w-full h-11 px-3 rounded-xl bg-surface-elevated text-sm font-sans border border-transparent focus:outline-none"
                >
                  {typeOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="job-currency" className="text-xs font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Moneda</label>
                <input
                  id="job-currency"
                  value={form.salaryCurrency}
                  onChange={(event) => updateField("salaryCurrency", event.target.value.toUpperCase())}
                  maxLength={5}
                  className="mt-1.5 w-full h-11 px-3 rounded-xl bg-surface-elevated text-sm font-sans border border-transparent focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="job-location" className="text-xs font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Ubicación</label>
              <input
                id="job-location"
                value={form.location}
                onChange={(event) => updateField("location", event.target.value)}
                placeholder="Bogotá, Colombia"
                className="mt-1.5 w-full h-11 px-3 rounded-xl bg-surface-elevated text-sm font-sans border border-transparent focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="job-description" className="text-xs font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Descripción</label>
              <textarea
                id="job-description"
                rows={6}
                value={form.description}
                onChange={(event) => updateField("description", event.target.value)}
                placeholder="Describe el rol, impacto esperado y responsabilidades clave..."
                className="mt-1.5 w-full p-3 rounded-xl bg-surface-elevated text-sm font-sans focus:outline-none focus:bg-card focus:border-foreground border border-transparent resize-none"
              />
            </div>

            <div>
              <label htmlFor="job-skills" className="text-xs font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Skills requeridas</label>
              <input
                id="job-skills"
                value={form.skills}
                onChange={(event) => updateField("skills", event.target.value)}
                placeholder="Figma, Design Systems, Research"
                className="mt-1.5 w-full h-11 px-3 rounded-xl bg-surface-elevated text-sm font-sans border border-transparent focus:outline-none"
              />
              {parsedSkills.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground font-sans">{parsedSkills.length} skills detectadas</p>
              )}
            </div>

            <div>
              <label htmlFor="job-requirements" className="text-xs font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Requisitos</label>
              <textarea
                id="job-requirements"
                rows={3}
                value={form.requirements}
                onChange={(event) => updateField("requirements", event.target.value)}
                placeholder="Años de experiencia, stack técnico, nivel de inglés..."
                className="mt-1.5 w-full p-3 rounded-xl bg-surface-elevated text-sm font-sans border border-transparent focus:outline-none resize-none"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="job-salary-min" className="text-xs font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Salario mínimo</label>
                <input
                  id="job-salary-min"
                  value={form.salaryMin}
                  onChange={(event) => updateField("salaryMin", event.target.value)}
                  type="number"
                  placeholder="4500"
                  className="mt-1.5 w-full h-11 px-3 rounded-xl bg-surface-elevated text-sm font-sans border border-transparent focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="job-salary-max" className="text-xs font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Salario máximo</label>
                <input
                  id="job-salary-max"
                  value={form.salaryMax}
                  onChange={(event) => updateField("salaryMax", event.target.value)}
                  type="number"
                  placeholder="6000"
                  className="mt-1.5 w-full h-11 px-3 rounded-xl bg-surface-elevated text-sm font-sans border border-transparent focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="job-benefits" className="text-xs font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Beneficios</label>
              <textarea
                id="job-benefits"
                rows={3}
                value={form.benefits}
                onChange={(event) => updateField("benefits", event.target.value)}
                placeholder="Seguro de salud, presupuesto de aprendizaje, vacaciones flexibles..."
                className="mt-1.5 w-full p-3 rounded-xl bg-surface-elevated text-sm font-sans border border-transparent focus:outline-none resize-none"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              disabled={saveJob.isPending}
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-foreground text-background text-sm font-subtitle font-semibold hover:bg-foreground/90 disabled:opacity-60"
            >
              {saveJob.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> {isEditMode ? "Guardando..." : "Publicando..."}
                </>
              ) : (
                isEditMode ? "Guardar cambios" : "Publicar vacante"
              )}
            </button>
          </div>
        </div>

        <aside className="rounded-2xl border border-border bg-card p-5 h-fit">
          <p className="text-xs font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Tip IA</p>
          <p className="mt-2 text-sm font-sans text-foreground/90 leading-relaxed">
            Empieza con el asistente IA para generar un primer borrador en segundos. Luego revisa, ajusta y publica. Las vacantes claras con skills específicas y salario visible convierten mejor.
          </p>
        </aside>
      </div>
      )}
    </div>
  );
};

export default EmpresaPublicar;
