import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, requireRole, type AuthRequest } from "../middleware/auth.middleware";

const router = Router();

const parseJsonText = (raw: string) => {
  const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned);
};

const normalizeTerm = (value: string) => value.trim().toLowerCase();

const capitalizeFirstAlpha = (value: string) => {
  const chars = [...value];
  const idx = chars.findIndex((char) => /[a-záéíóúñ]/i.test(char));
  if (idx < 0) return value;
  chars[idx] = chars[idx].toLocaleUpperCase("es-CO");
  return chars.join("");
};

const polishAiInlineText = (value: string) => {
  const normalized = value
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([,.;:!?])([^\s\n])/g, "$1 $2")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/\s*·\s*/g, " · ")
    .trim();

  return capitalizeFirstAlpha(normalized);
};

const polishAiText = (value: string, multiline = false) => {
  if (!multiline) return polishAiInlineText(value);

  return value
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("-")) {
        const content = trimmed.replace(/^-+\s*/, "");
        return `- ${polishAiInlineText(content)}`;
      }
      if (/^\d+\)/.test(trimmed)) {
        const content = trimmed.replace(/^\d+\)\s*/, "");
        const prefix = trimmed.match(/^\d+\)/)?.[0] || "";
        return `${prefix} ${polishAiInlineText(content)}`;
      }
      return polishAiInlineText(trimmed);
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const getRequirementsSkills = (requirements: unknown): string[] => {
  if (!requirements) return [];

  if (Array.isArray(requirements)) {
    return requirements.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean);
  }

  if (typeof requirements === "object" && requirements !== null) {
    const typed = requirements as { skills?: unknown };
    if (Array.isArray(typed.skills)) {
      return typed.skills.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean);
    }
  }

  if (typeof requirements === "string") {
    return requirements
      .split(/[,.\n]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 8);
  }

  return [];
};

const PROMPT_SKILL_HINTS = [
  "java",
  "spring",
  "spring boot",
  "node",
  "node.js",
  "typescript",
  "javascript",
  "python",
  "go",
  "golang",
  "php",
  "c#",
  "dotnet",
  "sql",
  "postgresql",
  "mysql",
  "mongodb",
  "redis",
  "aws",
  "azure",
  "gcp",
  "docker",
  "kubernetes",
  "microservicios",
  "api rest",
  "html",
  "css",
  "react",
  "next",
  "angular",
  "vue",
  "figma",
  "ux",
  "ui",
  "seo",
  "sem",
  "google ads",
  "meta ads",
  "excel",
  "power bi",
  "tableau",
  "ventas",
  "crm",
  "hubspot",
  "salesforce",
  "reclutamiento",
  "selección",
  "nomina",
  "nómina",
  "contabilidad",
  "finanzas",
  "atención al cliente",
  "service desk",
  "scrum",
  "kanban",
];

const CONTRACT_PATTERNS: Array<{ regex: RegExp; value: JobType }> = [
  { regex: /medio\s*tiempo|part\s*time/i, value: "PART_TIME" },
  { regex: /freelance|por\s*proyecto|contratista/i, value: "FREELANCE" },
  { regex: /pasant[ií]a|pr[aá]ctica|internship/i, value: "PASANTIA" },
  { regex: /tiempo\s*completo|full\s*time/i, value: "FULL_TIME" },
];

const SENIORITY_PATTERNS = [
  /junior|jr\.?/i,
  /semi\s*senior|ssr\.?/i,
  /senior|sr\.?/i,
  /lead/i,
  /principal/i,
  /manager/i,
  /coordinador|coordinadora/i,
];

const toTitleCase = (value: string) =>
  value
    .split(" ")
    .map((part) => {
      if (!part) return part;
      if (part.length <= 3 && part === part.toUpperCase()) return part;
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(" ");

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseAmount = (raw?: string) => {
  if (!raw) return undefined;
  const normalized = raw.toLowerCase().replace(/\./g, "").trim();
  const match = normalized.match(/^(\d+(?:[.,]\d+)?)\s*k?$/i);
  if (!match) return undefined;

  const base = Number(match[1].replace(",", "."));
  if (!Number.isFinite(base)) return undefined;

  return normalized.includes("k") ? Math.round(base * 1000) : Math.round(base);
};

const normalizeCurrency = (value?: string) => {
  if (!value) return undefined;
  const normalized = value.toUpperCase();
  if (["USD", "US$", "DOLARES", "DÓLARES"].includes(normalized)) return "USD";
  if (["COP", "$COP"].includes(normalized)) return "COP";
  if (["MXN", "$MXN"].includes(normalized)) return "MXN";
  if (["EUR", "€"].includes(normalized)) return "EUR";
  return normalized;
};

const extractSkillsFromContext = (text: string) => {
  const skillBlocks = [
    /(?:skills?|stack|tecnolog[ií]as?|herramientas?|conocimiento\s+en|manejo\s+de|experiencia\s+en)\s*[:\-]?\s*([^.;\n]+)/gi,
  ];

  const extracted: string[] = [];

  skillBlocks.forEach((pattern) => {
    let match: RegExpExecArray | null = null;
    while ((match = pattern.exec(text)) !== null) {
      const chunk = match[1] || "";
      chunk
        .split(/,|\sy\s|\s\/\s/i)
        .map((item) => item.trim())
        .filter((item) => item.length > 1 && item.length <= 40)
        .filter((item) => !/\d/.test(item))
        .filter((item) => !/\b(salario|sueldo|rango|cop|usd|mxn|eur|remoto|h[ií]brido|presencial)\b/i.test(item))
        .filter((item) => item.split(/\s+/).length <= 3)
        .forEach((item) => extracted.push(toTitleCase(item)));
    }
  });

  return Array.from(new Set(extracted)).slice(0, 12);
};

const inferBriefFromPrompt = (prompt?: string) => {
  const text = (prompt || "").trim();
  if (!text) return {};

  const lower = text.toLowerCase();

  const titlePatterns = [
    /(?:necesito|busco|requiero|vacante\s+para|perfil\s+de)\s+(?:un|una)?\s*(.+?)(?=\s+(?:con|para|en|remoto|h[ií]brido|presencial|salario|sueldo|rango|tipo)\b|$)/i,
    /(?:puesto|cargo|rol)\s*(?:de)?\s*[:\-]?\s*(.+?)(?=\s+(?:con|para|en|remoto|h[ií]brido|presencial|salario|sueldo|rango|tipo)\b|$)/i,
    /^(.+?)(?=\s+(?:con\s+\d+\s*años?|en|remoto|h[ií]brido|presencial|salario|sueldo|rango|tipo)\b|$)/i,
  ];

  const titleMatch = titlePatterns.map((pattern) => text.match(pattern)).find(Boolean);
  const roleTitle = titleMatch?.[1]?.trim();

  const yearsMatch = lower.match(/(\d{1,2})\s*años?/i);
  const years = yearsMatch?.[1];
  const keywordSeniority = SENIORITY_PATTERNS.map((pattern) => lower.match(pattern)?.[0]).find(Boolean);
  const seniority = years
    ? `${years} años de experiencia`
    : keywordSeniority
    ? keywordSeniority.toUpperCase().replace(".", "")
    : undefined;

  const modality: JobModality | undefined =
    lower.includes("remoto")
      ? "REMOTO"
      : lower.includes("hibrido") || lower.includes("híbrido")
      ? "HIBRIDO"
      : lower.includes("presencial")
      ? "PRESENCIAL"
      : undefined;

  const contractType = CONTRACT_PATTERNS.find((item) => item.regex.test(lower))?.value;

  const salaryRangeMatch = lower.match(/(?:salario|sueldo|pago|rango|budget)[^\d]{0,20}(\d+(?:[.,]\d+)?k?)(?:\s*(?:-|a|hasta|y)\s*(\d+(?:[.,]\d+)?k?))?\s*(usd|us\$|d[oó]lares|dolares|cop|mxn|eur|€)?/i);
  const rawMin = salaryRangeMatch?.[1];
  const rawMax = salaryRangeMatch?.[2];
  const minSalary = parseAmount(rawMin);
  const maxSalary = parseAmount(rawMax);

  const currencyByKeyword = normalizeCurrency(salaryRangeMatch?.[3]);
  const currencyByText =
    (lower.includes("usd") || lower.includes("dolares") || lower.includes("dólares"))
      ? "USD"
      : lower.includes("cop")
      ? "COP"
      : lower.includes("mxn")
      ? "MXN"
      : lower.includes("eur") || lower.includes("€")
      ? "EUR"
      : undefined;

  const currency = currencyByKeyword || currencyByText;

  const locationMatch = text.match(/\b(?:en|ubicaci[oó]n)\s*[:\-]?\s*([a-zA-ZáéíóúÁÉÍÓÚñÑ\s,.-]{3,50})(?=\s+(?:con|para|remoto|h[ií]brido|presencial|salario|sueldo|rango)|$)/i);
  const location = locationMatch?.[1]?.trim();

  const skillsFromContext = extractSkillsFromContext(text);

  const mustHaveSkillsByHints = PROMPT_SKILL_HINTS
    .filter((skill) => {
      const escaped = escapeRegex(skill);
      const pattern = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i");
      return pattern.test(lower);
    })
    .map((skill) => {
      if (skill === "node.js") return "Node.js";
      if (skill === "typescript") return "TypeScript";
      if (skill === "javascript") return "JavaScript";
      if (skill === "sql") return "SQL";
      if (skill === "aws") return "AWS";
      if (skill === "gcp") return "GCP";
      if (skill === "html") return "HTML";
      if (skill === "css") return "CSS";
      if (skill === "react") return "React";
      if (skill === "next") return "Next.js";
      if (skill === "angular") return "Angular";
      if (skill === "vue") return "Vue";
      return skill
        .split(" ")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
    })
    .slice(0, 10);

  const mustHaveSkills = Array.from(new Set([...skillsFromContext, ...mustHaveSkillsByHints])).slice(0, 12);

  return {
    roleTitle,
    seniority,
    modality,
    contractType,
    location,
    minSalary,
    maxSalary,
    currency,
    mustHaveSkills,
  };
};

const alignDraftWithPrompt = (draft: AiJobDraft, input: z.infer<typeof aiJobDraftInputSchema>) => {
  const inferred = inferBriefFromPrompt(input.prompt);
  const aligned = { ...draft };

  if (inferred.roleTitle) {
    const normalizedRole = inferred.roleTitle.toLowerCase();
    const titleHasRole = aligned.title.toLowerCase().includes(normalizedRole);
    if (!titleHasRole || aligned.title.toLowerCase().includes("equipo de crecimiento")) {
      aligned.title = inferred.seniority ? `${inferred.roleTitle} ${inferred.seniority}` : inferred.roleTitle;
    }
  }

  if (inferred.modality && aligned.modality !== inferred.modality) {
    aligned.modality = inferred.modality;
  }

  if (typeof inferred.minSalary === "number" && aligned.salaryMin === undefined) {
    aligned.salaryMin = inferred.minSalary;
  }

  if (typeof inferred.maxSalary === "number" && aligned.salaryMax === undefined) {
    aligned.salaryMax = inferred.maxSalary;
  }

  if (typeof inferred.minSalary === "number" && aligned.salaryMax !== undefined && aligned.salaryMax < inferred.minSalary) {
    aligned.salaryMax = undefined;
  }

  if (inferred.currency && (!aligned.salaryCurrency || aligned.salaryCurrency === "USD")) {
    aligned.salaryCurrency = inferred.currency;
  }

  if (inferred.location && (!aligned.location || aligned.location.toLowerCase() === "remoto latam")) {
    aligned.location = inferred.location;
  }

  if (Array.isArray(inferred.mustHaveSkills) && inferred.mustHaveSkills.length > 0) {
    const existing = new Set(aligned.skills.map((skill) => skill.toLowerCase()));
    const merged = [...aligned.skills];
    inferred.mustHaveSkills.forEach((skill) => {
      if (!existing.has(skill.toLowerCase())) {
        merged.push(skill);
      }
    });
    aligned.skills = merged.slice(0, 12);
  }

  return aligned;
};

const buildFallbackMatch = (
  user: {
    skills: Array<{ skill: { name: string } }>;
    experience: Array<{ title: string; company: string }>;
  },
  job: {
    skills: Array<{ skill: { name: string } }>;
    requirements: unknown;
  },
) => {
  const userSkills = Array.from(new Set(user.skills.map((s) => s.skill.name).filter(Boolean)));
  const jobSkillsFromRelation = job.skills.map((s) => s.skill.name).filter(Boolean);
  const jobSkillsFromRequirements = getRequirementsSkills(job.requirements);
  const jobSkills = Array.from(new Set([...jobSkillsFromRelation, ...jobSkillsFromRequirements]));

  const userSkillSet = new Set(userSkills.map(normalizeTerm));
  const matchedSkills = jobSkills.filter((skill) => userSkillSet.has(normalizeTerm(skill)));

  const coverage = jobSkills.length > 0 ? matchedSkills.length / jobSkills.length : 0.5;
  const experienceBonus = Math.min(user.experience.length * 5, 15);
  const score = Math.max(25, Math.min(95, Math.round(coverage * 80 + experienceBonus)));

  const reasons: string[] = [];
  if (matchedSkills.length > 0) {
    reasons.push(`Coincides en ${matchedSkills.length} skill(s) clave: ${matchedSkills.slice(0, 3).join(", ")}`);
  }
  if (user.experience.length > 0) {
    const latest = user.experience[0];
    reasons.push(`Tu experiencia reciente en ${latest.title} suma contexto para esta vacante`);
  }
  if (jobSkills.length > 0) {
    reasons.push(`Cobertura aproximada de skills requeridas: ${Math.round(coverage * 100)}%`);
  }

  const missingSkills = jobSkills.filter((skill) => !userSkillSet.has(normalizeTerm(skill))).slice(0, 2);
  const gaps = missingSkills.length > 0
    ? missingSkills.map((skill) => `Fortalecer ${skill}`)
    : ["No se detectaron brechas críticas en skills"];

  const recommendation = missingSkills.length > 0
    ? `Enfócate en reforzar ${missingSkills.join(" y ")} para subir tu match.`
    : "Tu perfil está bastante alineado; destaca resultados cuantificables al postularte.";

  return {
    score,
    reasons: reasons.map((reason) => polishAiText(reason)),
    gaps: gaps.map((gap) => polishAiText(gap)),
    recommendation: polishAiText(recommendation),
  };
};

type RecommendationItem = {
  id: string;
  score: number;
  reason: string;
};

const JOB_MODALITIES = ["REMOTO", "HIBRIDO", "PRESENCIAL"] as const;
const JOB_TYPES = ["FULL_TIME", "PART_TIME", "FREELANCE", "PASANTIA"] as const;

type JobModality = (typeof JOB_MODALITIES)[number];
type JobType = (typeof JOB_TYPES)[number];

type AiJobDraft = {
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

const aiJobDraftInputSchema = z
  .object({
    prompt: z.string().trim().min(10).max(1800).optional(),
    brief: z
      .object({
        roleTitle: z.string().trim().max(120).optional(),
        seniority: z.string().trim().max(60).optional(),
        industry: z.string().trim().max(100).optional(),
        modality: z.enum(JOB_MODALITIES).optional(),
        contractType: z.enum(JOB_TYPES).optional(),
        location: z.string().trim().max(120).optional(),
        responsibilities: z.string().trim().max(1200).optional(),
        mustHaveSkills: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
        niceToHaveSkills: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
        englishLevel: z.string().trim().max(60).optional(),
        minSalary: z.coerce.number().nonnegative().optional(),
        maxSalary: z.coerce.number().nonnegative().optional(),
        currency: z.string().trim().min(2).max(5).optional(),
      })
      .optional(),
  })
  .refine((data) => Boolean(data.prompt?.trim() || data.brief), {
    message: "Debes enviar un prompt o un brief guiado",
  });

const normalizeSkills = (value: unknown) => {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    ).slice(0, 12);
  }

  if (typeof value === "string") {
    return Array.from(
      new Set(
        value
          .split(/[,\n]/)
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    ).slice(0, 12);
  }

  return [];
};

const formatAmount = (value: number) => (Number.isInteger(value) ? value.toString() : value.toFixed(2));

const buildFallbackJobDraft = (input: z.infer<typeof aiJobDraftInputSchema>) => {
  const promptBrief = inferBriefFromPrompt(input.prompt);
  const brief = {
    ...promptBrief,
    ...(input.brief || {}),
    mustHaveSkills: input.brief?.mustHaveSkills ?? promptBrief.mustHaveSkills,
    niceToHaveSkills: input.brief?.niceToHaveSkills,
  };
  const mustHaveSkills = brief?.mustHaveSkills ?? [];
  const niceToHaveSkills = brief?.niceToHaveSkills ?? [];
  const mergedSkills = Array.from(new Set([...mustHaveSkills, ...niceToHaveSkills].map((skill) => skill.trim()).filter(Boolean))).slice(0, 12);

  const roleTitle = brief?.roleTitle?.trim();
  const seniority = brief?.seniority?.trim();
  const title = roleTitle
    ? [roleTitle, seniority].filter(Boolean).join(" ")
    : "Especialista para equipo de crecimiento";

  const location = brief?.location?.trim() || "Remoto LATAM";
  const modality = brief?.modality || (brief?.location ? "PRESENCIAL" : "REMOTO");
  const type = brief?.contractType || "FULL_TIME";
  const currency = (brief?.currency?.trim() || "USD").toUpperCase();

  const salaryRange =
    typeof brief?.minSalary === "number" || typeof brief?.maxSalary === "number"
      ? `Rango estimado: ${brief?.minSalary ? `${currency} ${formatAmount(brief.minSalary)}` : "A convenir"}${
          brief?.maxSalary ? ` - ${currency} ${formatAmount(brief.maxSalary)}` : ""
        }.`
      : "Compensación competitiva según experiencia.";

  const description = [
    `Buscamos ${title} para integrarse a nuestro equipo${brief?.industry ? ` en la industria ${brief.industry}` : ""}.`,
    brief?.responsibilities?.trim() || "La persona liderará entregables clave, colaborará con equipos multidisciplinarios y aportará mejoras continuas al producto.",
    salaryRange,
  ].join(" ");

  const requirementsBullets = [
    mustHaveSkills.length > 0 ? `Skills obligatorias: ${mustHaveSkills.join(", ")}.` : null,
    niceToHaveSkills.length > 0 ? `Skills deseables: ${niceToHaveSkills.join(", ")}.` : null,
    brief?.englishLevel ? `Nivel de inglés esperado: ${brief.englishLevel}.` : null,
    "Experiencia demostrable resolviendo retos similares y comunicando resultados con claridad.",
  ].filter(Boolean);

  const requirements = requirementsBullets.join("\n");

  const benefits = [
    "Plan de crecimiento profesional con feedback continuo.",
    modality === "REMOTO" ? "Trabajo remoto con horarios flexibles." : "Esquema de trabajo flexible según modalidad.",
    "Ambiente colaborativo con foco en impacto y resultados.",
  ].join("\n");

  const screeningQuestions = [
    `¿Qué experiencia previa tienes en un rol como ${title}?`,
    mergedSkills[0] ? `Cuéntanos un proyecto concreto donde aplicaste ${mergedSkills[0]}.` : "¿Cuál ha sido tu contribución de mayor impacto en tu último rol?",
    "¿Qué disponibilidad tienes para iniciar y cuál es tu expectativa salarial?",
  ];

  return {
    title,
    description,
    requirements,
    benefits,
    location,
    modality,
    type,
    salaryMin: brief?.minSalary,
    salaryMax: brief?.maxSalary,
    salaryCurrency: currency,
    skills: mergedSkills,
    screeningQuestions,
  } satisfies AiJobDraft;
};

const normalizeAiJobDraft = (raw: unknown, input: z.infer<typeof aiJobDraftInputSchema>) => {
  const fallback = buildFallbackJobDraft(input);
  if (!raw || typeof raw !== "object") return fallback;

  const typed = raw as Record<string, unknown>;

  const modality = typeof typed.modality === "string" && JOB_MODALITIES.includes(typed.modality as JobModality)
    ? (typed.modality as JobModality)
    : fallback.modality;

  const type = typeof typed.type === "string" && JOB_TYPES.includes(typed.type as JobType)
    ? (typed.type as JobType)
    : fallback.type;

  const salaryMin = typeof typed.salaryMin === "number" && Number.isFinite(typed.salaryMin)
    ? typed.salaryMin
    : fallback.salaryMin;
  const salaryMax = typeof typed.salaryMax === "number" && Number.isFinite(typed.salaryMax)
    ? typed.salaryMax
    : fallback.salaryMax;

  const skills = normalizeSkills(typed.skills);
  const screeningQuestions = Array.isArray(typed.screeningQuestions)
    ? typed.screeningQuestions
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 5)
    : fallback.screeningQuestions;

  const normalizedDraft = {
    title: typeof typed.title === "string" && typed.title.trim().length >= 4 ? polishAiText(typed.title) : polishAiText(fallback.title),
    description:
      typeof typed.description === "string" && typed.description.trim().length >= 60
        ? polishAiText(typed.description)
        : polishAiText(fallback.description),
    requirements:
      typeof typed.requirements === "string" && typed.requirements.trim().length >= 20
        ? polishAiText(typed.requirements)
        : polishAiText(fallback.requirements),
    benefits:
      typeof typed.benefits === "string" && typed.benefits.trim().length >= 10
        ? polishAiText(typed.benefits)
        : polishAiText(fallback.benefits),
    location: typeof typed.location === "string" && typed.location.trim().length > 1 ? polishAiText(typed.location) : polishAiText(fallback.location),
    modality,
    type,
    salaryMin,
    salaryMax,
    salaryCurrency:
      typeof typed.salaryCurrency === "string" && typed.salaryCurrency.trim().length >= 2
        ? typed.salaryCurrency.trim().toUpperCase()
        : fallback.salaryCurrency,
    skills: skills.length > 0 ? skills : fallback.skills,
    screeningQuestions: (screeningQuestions.length > 0 ? screeningQuestions : fallback.screeningQuestions).map((question) =>
      polishAiText(question),
    ),
  } satisfies AiJobDraft;

  return alignDraftWithPrompt(normalizedDraft, input);
};

const extractSkillNamesFromOpportunity = (opportunity: unknown): string[] => {
  if (!opportunity || typeof opportunity !== "object") return [];

  const typed = opportunity as {
    skills?: Array<{ skill?: { name?: string } }>;
    skillsRequired?: unknown;
    rolesNeeded?: unknown;
  };

  const relationalSkills = Array.isArray(typed.skills)
    ? typed.skills
        .map((s) => s?.skill?.name)
        .filter((name): name is string => typeof name === "string" && Boolean(name.trim()))
    : [];

  const explicitSkills = Array.isArray(typed.skillsRequired)
    ? typed.skillsRequired
        .filter((s): s is string => typeof s === "string")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const rolesNeededSkills = Array.isArray(typed.rolesNeeded)
    ? typed.rolesNeeded.flatMap((role) => {
        if (!role || typeof role !== "object") return [] as string[];
        const roleSkills = (role as { skills?: unknown }).skills;
        if (!Array.isArray(roleSkills)) return [] as string[];
        return roleSkills
          .filter((s): s is string => typeof s === "string")
          .map((s) => s.trim())
          .filter(Boolean);
      })
    : [];

  return Array.from(new Set([...relationalSkills, ...explicitSkills, ...rolesNeededSkills]));
};

const buildDeterministicRecommendations = (
  opportunities: unknown[],
  userSkillNames: string[],
): RecommendationItem[] => {
  const normalizedUserSkills = new Set(userSkillNames.map(normalizeTerm));

  return opportunities
    .map((opportunity) => {
      if (!opportunity || typeof opportunity !== "object") return null;

      const typed = opportunity as { id?: unknown; title?: unknown; name?: unknown; description?: unknown };
      if (typeof typed.id !== "string") return null;

      const opportunitySkills = extractSkillNamesFromOpportunity(opportunity);
      const matchedSkills = opportunitySkills.filter((skill) => normalizedUserSkills.has(normalizeTerm(skill)));

      const coverage = opportunitySkills.length > 0 ? matchedSkills.length / opportunitySkills.length : 0;
      const score = Math.max(25, Math.min(95, Math.round(coverage * 85 + (matchedSkills.length > 0 ? 10 : 0))));

      const title = typeof typed.title === "string"
        ? typed.title
        : typeof typed.name === "string"
        ? typed.name
        : "oportunidad";

      const reason = matchedSkills.length > 0
        ? `Coincides en ${matchedSkills.length} skill(s) clave para ${title}: ${matchedSkills.slice(0, 3).join(", ")}`
        : `Tu perfil tiene señales parciales para ${title}; completa skills específicas para mejorar el match.`;

      return {
        id: typed.id,
        score,
        reason: polishAiText(reason),
      } satisfies RecommendationItem;
    })
    .filter((item): item is RecommendationItem => Boolean(item))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
};

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> => {
  let timeoutHandle: NodeJS.Timeout | null = null;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
};

const isOllamaMemoryError = (details: string) =>
  details.toLowerCase().includes("requires more system memory") ||
  details.toLowerCase().includes("not enough memory");

const runOllamaGenerate = async (
  prompt: string,
  maxTokens: number,
  asJson: boolean,
  preferredModel?: string,
) => {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
  const primaryModel = preferredModel || process.env.OLLAMA_MODEL || "llama3.1:8b";
  const lowMemoryModel = process.env.OLLAMA_LOW_MEMORY_MODEL || "qwen2.5:0.5b";

  const tryWithModel = async (model: string) => {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        ...(asJson ? { format: "json" } : {}),
        options: { temperature: asJson ? 0.2 : 0.4, num_predict: maxTokens },
        prompt,
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Ollama respondió ${response.status}: ${details}`);
    }

    const data = (await response.json()) as { response?: string };
    if (!data.response) {
      throw new Error("Ollama no devolvió contenido en la respuesta");
    }

    return data.response;
  };

  try {
    return await tryWithModel(primaryModel);
  } catch (err) {
    const message = (err as Error).message || "";
    const shouldRetryWithLowMemoryModel =
      isOllamaMemoryError(message) &&
      lowMemoryModel &&
      lowMemoryModel !== primaryModel;

    if (!shouldRetryWithLowMemoryModel) {
      throw err;
    }

    console.warn(`[AI] Memoria insuficiente para ${primaryModel}. Reintentando con ${lowMemoryModel}...`);

    try {
      return await tryWithModel(lowMemoryModel);
    } catch (fallbackErr) {
      const fallbackMessage = (fallbackErr as Error).message || "";
      if (fallbackMessage.toLowerCase().includes("model") && fallbackMessage.toLowerCase().includes("not found")) {
        throw new Error(
          `Ollama no tiene el modelo de bajo consumo '${lowMemoryModel}'. Ejecuta: ollama pull ${lowMemoryModel}`,
        );
      }
      throw fallbackErr;
    }
  }
};

const runOllamaJson = async (prompt: string, maxTokens: number, model?: string) => {
  const output = await runOllamaGenerate(prompt, maxTokens, true, model);
  return parseJsonText(output);
};

const runOllamaText = async (prompt: string, maxTokens: number, model?: string) => {
  const output = await runOllamaGenerate(prompt, maxTokens, false, model);
  return output.trim();
};

const runAiJson = async (prompt: string, maxTokens: number, model?: string) => runOllamaJson(prompt, maxTokens, model);

const runAiText = async (
  systemPrompt: string,
  history: { role: "user" | "assistant"; content: string }[],
  maxTokens: number,
  model?: string,
) => {
  const transcript = history
    .map((m) => `${m.role === "user" ? "Usuario" : "Asistente"}: ${m.content}`)
    .join("\n\n");
  const prompt = `Sistema:\n${systemPrompt}\n\nConversación:\n${transcript}\n\nResponde como Asistente en español LATAM, de forma útil y concreta. No inventes datos que no estén en el contexto.`;

  return runOllamaText(prompt, maxTokens, model);
};

const normalizeAssistantText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const buildDataAwareFallbackReply = async (params: {
  context: "recruiter" | "career_advice" | "pre_interview";
  message: string;
  userId: string;
  userRole?: unknown;
  userHeadline?: string | null;
  userBio?: string | null;
  userSkillsCount?: number;
}) => {
  const { context, message, userId, userRole, userHeadline, userBio, userSkillsCount = 0 } = params;
  const normalizedMessage = normalizeAssistantText(message);
  const normalizedRole = normalizeAssistantText(String(userRole || ""));

  const asksActiveProposals = normalizedMessage.includes("propuesta") && normalizedMessage.includes("activ");
  const asksThisMonthEarnings =
    (normalizedMessage.includes("cuanto llevo") || normalizedMessage.includes("ingreso") || normalizedMessage.includes("este mes")) &&
    (normalizedMessage.includes("mes") || normalizedMessage.includes("ingreso") || normalizedMessage.includes("llevo"));
  const asksPublishedServices = normalizedMessage.includes("servicio") && (normalizedMessage.includes("public") || normalizedMessage.includes("cuantos"));
  const asksProfileImprovement =
    normalizedMessage.includes("mejoro") ||
    normalizedMessage.includes("mejorar") ||
    normalizedMessage.includes("perfil");

  if (normalizedRole === "freelancer" && context === "career_advice" && (asksActiveProposals || asksThisMonthEarnings || asksPublishedServices)) {
    const [activeProposals, publishedServices, completedProjects] = await Promise.all([
      prisma.proposal.count({
        where: {
          freelancerId: userId,
          status: { in: ["ENVIADA", "EN_REVISION", "ACEPTADA"] },
        },
      }),
      prisma.freelanceService.count({
        where: {
          freelancerId: userId,
          isActive: true,
        },
      }),
      prisma.freelanceProject.findMany({
        where: {
          freelancerId: userId,
          status: "COMPLETADO",
        },
        select: {
          updatedAt: true,
          budget: true,
          escrow: { select: { amount: true } },
        },
      }),
    ]);

    const now = new Date();
    const thisMonthTotal = completedProjects
      .filter((project) => {
        const updatedAt = new Date(project.updatedAt);
        return updatedAt.getMonth() === now.getMonth() && updatedAt.getFullYear() === now.getFullYear();
      })
      .reduce((sum, project) => sum + (project.escrow?.amount || project.budget || 0), 0);

    const lines: string[] = ["Ollama no respondió esta vez, pero aquí tienes tus métricas reales:"];
    if (asksActiveProposals) {
      lines.push(`- Propuestas activas: ${activeProposals}`);
    }
    if (asksThisMonthEarnings) {
      lines.push(`- Ingresos de este mes: $${Math.round(thisMonthTotal).toLocaleString("es-CO")} USD`);
    }
    if (asksPublishedServices) {
      lines.push(`- Servicios publicados: ${publishedServices}`);
    }

    lines.push("Si quieres, te doy 3 acciones para subir conversión de propuestas esta semana.");
    return lines.join("\n");
  }

  if (context === "career_advice" && asksProfileImprovement) {
    const tips: string[] = [];
    if (!userHeadline?.trim()) {
      tips.push("Define un headline claro con rol + especialidad + resultado (ej. 'Frontend React | UX orientado a conversión').");
    }
    if (!userBio?.trim() || userBio.trim().length < 80) {
      tips.push("Amplía tu bio con logros medibles, stack principal y tipo de proyectos objetivo.");
    }
    if (userSkillsCount < 5) {
      tips.push("Sube al menos 5 skills clave y ordénalas por fortaleza para mejorar visibilidad en matching.");
    }

    if (tips.length === 0) {
      tips.push("Tu perfil está bien encaminado. Sube evidencia (portfolio/casos) y actualiza logros del último mes para mejorar ranking.");
    }

    return [
      "No pude usar el modelo IA ahora mismo, pero te dejo mejoras concretas de perfil:",
      ...tips.map((tip) => `- ${tip}`),
    ].join("\n");
  }

  return null;
};

const buildFallbackChatReply = (context: "recruiter" | "career_advice" | "pre_interview", message: string) => {
  const normalized = message.trim();

  if (context === "recruiter") {
    return [
      "Ahora mismo el motor IA está con alta carga, pero puedo ayudarte con una guía rápida:",
      `1) Define el perfil exacto del candidato para: \"${normalized}\"`,
      "2) Filtra por skills obligatorias y años de experiencia.",
      "3) Prioriza candidatos con match > 75 y valida señales de riesgo.",
      "4) Agenda entrevista con preguntas por competencias y caso práctico corto.",
    ].join("\n");
  }

  if (context === "pre_interview") {
    return [
      "No pude generar preguntas IA en este momento. Usa este set base de pre-entrevista:",
      "- Cuéntame un proyecto reciente y tu impacto concreto.",
      "- ¿Qué stack dominas y en qué nivel?",
      "- ¿Cómo priorizas tareas cuando todo parece urgente?",
      "- ¿Qué disponibilidad tienes para este rol?",
      "- ¿Cuál fue el reto técnico más complejo que resolviste?",
    ].join("\n");
  }

  return [
    "No pude conectarme al modelo IA ahora mismo, pero aquí tienes un siguiente paso útil:",
    `- Para \"${normalized}\", define objetivo, horizonte (30-60 días) y skill principal a reforzar.`,
    "- Si quieres, te propongo un plan semanal de mejora con acciones concretas.",
  ].join("\n");
};

// POST /api/ai/chat — AI Recruiter / chatbot general
router.post("/chat", authenticate, async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    message: z.string().min(1).max(2000),
    context: z.enum(["recruiter", "career_advice", "pre_interview"]).default("recruiter"),
    sessionId: z.string().optional(),
    jobId: z.string().optional(),
  });

  try {
    const chatModel = process.env.OLLAMA_MODEL_CHAT || process.env.OLLAMA_MODEL || "llama3.1:8b";
    const { message, context, sessionId, jobId } = schema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { name: true, role: true, headline: true, bio: true, skills: { include: { skill: true } } },
    });

    let jobContext = "";
    if (jobId) {
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        select: { title: true, description: true, requirements: true, skills: { include: { skill: true } } },
      });
      if (job) {
        jobContext = `\nVacante en evaluación: "${job.title}"\nDescripción: ${job.description}\nRequerimientos: ${job.requirements || "No especificados"}`;
      }
    }

    const systemPrompt = context === "pre_interview"
      ? `Eres un reclutador IA de Joblify evaluando a ${user?.name}. Realiza preguntas de pre-entrevista relevantes para la vacante. Sé amable, profesional y en español LATAM.${jobContext}`
      : context === "career_advice"
      ? `Eres un coach de carrera IA en Joblify, experto en el mercado laboral de LATAM. Ayudas a ${user?.name} (${user?.headline || user?.role}) con consejos de carrera, CV y habilidades. Responde en español, con empatía y datos concretos.`
      : `Eres el AI Recruiter de Joblify, el ecosistema profesional #1 de LATAM. Conectas talento con oportunidades. El usuario es ${user?.name} con rol ${user?.role}. Sus skills: ${user?.skills.map(s => s.skill.name).join(", ") || "no especificadas"}. Ayúdale a encontrar vacantes, freelance, cofundadores o prácticas según lo que necesite. Responde siempre en español LATAM, de forma directa y útil.`;

    let history: { role: "user" | "assistant"; content: string }[] = [];
    if (sessionId) {
      const session = await prisma.aiChatSession.findUnique({ where: { id: sessionId } });
      if (session) history = session.messages as typeof history;
    }

    history.push({ role: "user", content: message });

    let reply = "";

    try {
      reply = await runAiText(systemPrompt, history, 1024, chatModel);
    } catch (aiError) {
      console.error("[AI Chat] Error del proveedor, usando fallback:", aiError);
      const dataAwareFallback = await buildDataAwareFallbackReply({
        context,
        message,
        userId: req.user!.id,
        userRole: user?.role,
        userHeadline: user?.headline,
        userBio: user?.bio,
        userSkillsCount: user?.skills.length || 0,
      });
      reply = dataAwareFallback || buildFallbackChatReply(context, message);
    }

    if (!reply || !reply.trim()) {
      const dataAwareFallback = await buildDataAwareFallbackReply({
        context,
        message,
        userId: req.user!.id,
        userRole: user?.role,
        userHeadline: user?.headline,
        userBio: user?.bio,
        userSkillsCount: user?.skills.length || 0,
      });
      reply = dataAwareFallback || buildFallbackChatReply(context, message);
    }

    reply = polishAiText(reply, true);

    history.push({ role: "assistant", content: reply });

    const savedSession = sessionId
      ? await prisma.aiChatSession.update({
          where: { id: sessionId },
          data: { messages: history },
        })
      : await prisma.aiChatSession.create({
          data: { userId: req.user!.id, context, messages: history },
        });

    res.json({ reply, sessionId: savedSession.id });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    console.error(err);
    res.status(500).json({ error: "Error en el chat IA" });
  }
});

// POST /api/ai/job-draft — genera borrador estructurado de vacante para empresa
router.post("/job-draft", authenticate, requireRole("EMPRESA"), async (req: AuthRequest, res: Response) => {
  try {
    const chatModel = process.env.OLLAMA_MODEL_CHAT || process.env.OLLAMA_MODEL || "llama3.1:8b";
    const input = aiJobDraftInputSchema.parse(req.body);
    const fallbackDraft = buildFallbackJobDraft(input);

    const prompt = `Eres un recruiter senior de Joblify y debes crear un borrador de vacante listo para publicar.

Contexto de la empresa:
- Prompt libre: ${input.prompt || "No enviado"}
- Brief guiado: ${JSON.stringify(input.brief || {}, null, 2)}

Reglas:
- Responde SOLO JSON válido.
- Español LATAM, tono profesional y claro.
- Descripción enfocada en impacto y responsabilidades reales (120-260 palabras).
- Requisitos específicos, no genéricos.
- Usa modalidades válidas: ${JOB_MODALITIES.join(" | ")}.
- Usa tipos válidos: ${JOB_TYPES.join(" | ")}.
- Skills concretas y accionables.
- 3 a 5 preguntas de pre-filtro útiles para reclutamiento.

Formato exacto:
{
  "title": "string",
  "description": "string",
  "requirements": "string",
  "benefits": "string",
  "location": "string",
  "modality": "REMOTO|HIBRIDO|PRESENCIAL",
  "type": "FULL_TIME|PART_TIME|FREELANCE|PASANTIA",
  "salaryMin": 0,
  "salaryMax": 0,
  "salaryCurrency": "USD",
  "skills": ["string"],
  "screeningQuestions": ["string"]
}`;

    try {
      const aiResult = await withTimeout(runAiJson(prompt, 900, chatModel), 12000, "Tiempo de espera agotado en borrador IA");
      const draft = normalizeAiJobDraft(aiResult, input);

      return res.json({
        source: "ai",
        draft,
        fallbackDraft,
      });
    } catch (err) {
      console.warn("[AI Job Draft] Fallo IA, usando fallback:", (err as Error).message);
      return res.json({
        source: "fallback",
        draft: fallbackDraft,
      });
    }
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    console.error("[AI Job Draft]", err);
    return res.status(500).json({ error: "Error generando borrador de vacante" });
  }
});

// POST /api/ai/match — calcula match score entre usuario y vacante
router.post("/match", authenticate, async (req: AuthRequest, res: Response) => {
  const matchModel = process.env.OLLAMA_MODEL_MATCH || process.env.OLLAMA_MODEL || "qwen2.5:3b";
  const { jobId } = req.body;
  if (!jobId) return res.status(400).json({ error: "jobId requerido" });

  try {
    const [user, job] = await Promise.all([
      prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          name: true, headline: true, bio: true,
          skills: { include: { skill: true } },
          experience: { take: 3, orderBy: { startDate: "desc" } },
        },
      }),
      prisma.job.findUnique({
        where: { id: jobId },
        select: { title: true, description: true, requirements: true, skills: { include: { skill: true } } },
      }),
    ]);

    if (!user || !job) return res.status(404).json({ error: "Usuario o vacante no encontrado" });

    const prompt = `Analiza la compatibilidad entre este candidato y esta vacante. Responde SOLO con JSON válido.

CANDIDATO:
- Perfil: ${user.headline || "Sin headline"}
- Skills: ${user.skills.map(s => s.skill.name).join(", ")}
- Experiencia reciente: ${user.experience.map(e => `${e.title} en ${e.company}`).join("; ")}
- Bio: ${user.bio || "Sin bio"}

VACANTE: ${job.title}
- Descripción: ${job.description}
- Skills requeridos: ${job.skills.map(s => s.skill.name).join(", ")}
- Requisitos: ${job.requirements || "No especificados"}

Responde ÚNICAMENTE con este JSON (sin texto adicional):
{
  "score": <número del 0 al 100>,
  "reasons": [<3 razones cortas de por qué encaja o no, máximo 18 palabras cada una>],
  "gaps": [<hasta 2 brechas principales, máximo 10 palabras cada una>],
  "recommendation": "<frase corta de recomendación, máximo 16 palabras>"
}`;

    let result: { score: number; reasons: string[]; gaps?: string[]; recommendation?: string };

    try {
      result = await withTimeout(
        runAiJson(prompt, 512, matchModel) as Promise<{ score: number; reasons: string[]; gaps?: string[]; recommendation?: string }>,
        8000,
        "Tiempo de espera agotado en análisis IA",
      );
    } catch (aiError) {
      console.warn("[AI Match] Fallo IA, aplicando fallback determinístico:", (aiError as Error).message);
      result = buildFallbackMatch(user, job);
    }

    if (typeof result.score !== "number" || !Array.isArray(result.reasons)) {
      result = buildFallbackMatch(user, job);
    }

    result = {
      ...result,
      reasons: (result.reasons || []).map((reason) => polishAiText(reason)),
      gaps: (result.gaps || []).map((gap) => polishAiText(gap)),
      recommendation: result.recommendation ? polishAiText(result.recommendation) : undefined,
    };

    await prisma.application.updateMany({
      where: { jobId, applicantId: req.user!.id },
      data: { matchScore: result.score, aiExplanation: result.reasons?.join(" · ") },
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error calculando match" });
  }
});

// POST /api/ai/improve-profile — sugerencias para mejorar perfil
router.post("/improve-profile", authenticate, async (req: AuthRequest, res: Response) => {
  const chatModel = process.env.OLLAMA_MODEL_CHAT || process.env.OLLAMA_MODEL || "llama3.1:8b";
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      role: true, headline: true, bio: true, profileCompletion: true,
      skills: { include: { skill: true } },
      experience: { take: 2 },
      education: { take: 1 },
    },
  });
  if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

  const prompt = `Analiza este perfil de Joblify y da 3 sugerencias concretas para mejorarlo. Sé específico y útil.

Rol: ${user.role}
Headline: ${user.headline || "Vacío"}
Bio: ${user.bio || "Vacía"}
Skills: ${user.skills.map(s => s.skill.name).join(", ") || "Ninguna"}
Experiencia: ${user.experience.length} entradas
Educación: ${user.education.length} entradas
Completitud actual: ${user.profileCompletion}%

Responde con JSON:
{
  "suggestions": [
    { "field": "<campo a mejorar>", "tip": "<consejo específico>", "impact": "alto|medio|bajo" }
  ]
}`;

  try {
    const result = await runAiJson(prompt, 512, chatModel);
    const typed = (result && typeof result === "object" ? result : {}) as {
      suggestions?: Array<{ field?: unknown; tip?: unknown; impact?: unknown }>;
    };

    const suggestions = Array.isArray(typed.suggestions)
      ? typed.suggestions
          .map((suggestion) => {
            if (!suggestion || typeof suggestion !== "object") return null;
            const field = typeof suggestion.field === "string" && suggestion.field.trim()
              ? polishAiText(suggestion.field)
              : "Perfil";
            const tip = typeof suggestion.tip === "string" && suggestion.tip.trim()
              ? polishAiText(suggestion.tip)
              : "Refuerza la claridad de tu perfil con logros medibles y habilidades clave.";
            const impact = suggestion.impact === "alto" || suggestion.impact === "medio" || suggestion.impact === "bajo"
              ? suggestion.impact
              : "medio";
            return { field, tip, impact };
          })
          .filter((item): item is { field: string; tip: string; impact: "alto" | "medio" | "bajo" } => Boolean(item))
      : [];

    const fallbackSuggestions = [
      {
        field: "Titular profesional",
        tip: "Resume tu perfil en una frase clara con rol, especialidad y valor diferencial.",
        impact: "alto" as const,
      },
      {
        field: "Descripción",
        tip: "Añade logros con métricas concretas y resultados que demuestren impacto.",
        impact: "alto" as const,
      },
      {
        field: "Habilidades",
        tip: "Prioriza habilidades clave del rol objetivo y mantenlas actualizadas.",
        impact: "medio" as const,
      },
    ];

    res.json({ suggestions: suggestions.length > 0 ? suggestions : fallbackSuggestions });
  } catch {
    res.status(500).json({ error: "Error generando sugerencias" });
  }
});

// GET /api/ai/recommendations — recomendaciones personalizadas
router.get("/recommendations", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const matchModel = process.env.OLLAMA_MODEL_MATCH || process.env.OLLAMA_MODEL || "qwen2.5:3b";
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        role: true,
        headline: true,
        bio: true,
        skills: { include: { skill: true }, take: 10 },
        experience: { take: 2, orderBy: { startDate: "desc" } },
      },
    });

    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    let opportunities: unknown[] = [];
    let opportunityType = "vacantes";
    const normalizedRole = String(user.role || "").toLowerCase();

    if (normalizedRole === "candidato" || normalizedRole === "estudiante") {
      const jobs = await prisma.job.findMany({
        where: { isActive: true },
        take: 12,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          location: true,
          modality: true,
          skills: { include: { skill: true } },
          poster: { select: { name: true } },
        },
      });
      opportunities = jobs;
      opportunityType = "vacantes";
    } else if (normalizedRole === "emprendedor") {
      const startups = await prisma.startup.findMany({
        take: 12,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          description: true,
          stage: true,
          sector: true,
        },
      });
      opportunities = startups;
      opportunityType = "proyectos";
    } else if (normalizedRole === "freelancer") {
      const projects = await prisma.freelanceProject.findMany({
        take: 12,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          budget: true,
          deadline: true,
        },
      });
      opportunities = projects;
      opportunityType = "proyectos freelance";
    }

    if (opportunities.length === 0) {
      return res.json({ recommendations: [], message: "No hay oportunidades disponibles en este momento" });
    }

    const userSkills = user.skills.map(s => s.skill.name).join(", ");
    const prompt = `Analiza el perfil del usuario y rankea las ${opportunities.length} ${opportunityType} por relevancia.

Usuario:
- Rol: ${user.role}
- Headline: ${user.headline || "Sin especificar"}
- Skills: ${userSkills || "Sin skills"}
- Bio: ${user.bio || "Sin bio"}

${opportunityType.charAt(0).toUpperCase() + opportunityType.slice(1)}:
${JSON.stringify(opportunities, null, 2)}

Responde ÚNICAMENTE con JSON válido:
{
  "recommendations": [
    {
      "id": "<id de la oportunidad>",
      "score": <número 0-100>,
      "reason": "<explicación corta, máximo 18 palabras, de por qué es relevante>"
    }
  ]
}

Ordena por score descendente y devuelve solo las top 8.`;

    const userSkillNames = user.skills.map((s) => s.skill.name).filter(Boolean);
    const deterministicRecommendations = buildDeterministicRecommendations(opportunities, userSkillNames);

    let aiRecommendations: RecommendationItem[] = [];

    try {
      const aiResult = await withTimeout(
        runAiJson(prompt, 2048, matchModel) as Promise<{ recommendations?: unknown }>,
        10000,
        "Tiempo de espera agotado en recomendaciones IA",
      );

      if (Array.isArray(aiResult.recommendations)) {
        aiRecommendations = aiResult.recommendations
          .map((rec) => {
            if (!rec || typeof rec !== "object") return null;
            const typed = rec as { id?: unknown; score?: unknown; reason?: unknown };
            if (typeof typed.id !== "string") return null;

            const scoreNumber = typeof typed.score === "number" ? typed.score : Number(typed.score);
            if (!Number.isFinite(scoreNumber)) return null;

            return {
              id: typed.id,
              score: Math.max(0, Math.min(100, Math.round(scoreNumber))),
              reason: typeof typed.reason === "string" && typed.reason.trim().length > 0
                ? polishAiText(typed.reason)
                : "Relevante según tu perfil actual.",
            } satisfies RecommendationItem;
          })
          .filter((rec): rec is RecommendationItem => Boolean(rec));
      }
    } catch (err) {
      console.warn("[AI Recommendations] Fallo IA, usando fallback determinístico:", (err as Error).message);
    }

    const validOpportunityIds = new Set(
      opportunities
        .map((opportunity) => (opportunity && typeof opportunity === "object" ? (opportunity as { id?: unknown }).id : null))
        .filter((id): id is string => typeof id === "string"),
    );

    const deterministicById = new Map(deterministicRecommendations.map((rec) => [rec.id, rec]));

    const mergedRecommendations = [
      ...aiRecommendations
        .filter((rec) => validOpportunityIds.has(rec.id))
        .map((rec) => {
          const deterministic = deterministicById.get(rec.id);
          if (!deterministic) return rec;

          return {
            id: rec.id,
            score: Math.round(rec.score * 0.7 + deterministic.score * 0.3),
            reason: rec.reason,
          } satisfies RecommendationItem;
        }),
      ...deterministicRecommendations.filter((rec) => !aiRecommendations.some((aiRec) => aiRec.id === rec.id)),
    ]
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    res.json({ recommendations: mergedRecommendations });
  } catch (err) {
    console.error("[AI Recommendations]", err);
    res.status(500).json({ error: "Error generando recomendaciones" });
  }
});

// POST /api/ai/moderate-content — moderación de contenido generado por usuario
router.post("/moderate-content", authenticate, async (req: AuthRequest, res: Response) => {
  const moderationModel = process.env.OLLAMA_MODEL_MODERATION || process.env.OLLAMA_MODEL || "phi3:mini";
  const schema = z.object({
    text: z.string().trim().min(1).max(3000),
    context: z.enum(["post", "comment", "message", "general"]).default("general"),
  });

  try {
    const { text, context } = schema.parse(req.body);

    const prompt = `Evalúa si este contenido puede publicarse en Joblify bajo normas básicas de comunidad profesional (sin odio, amenazas, acoso extremo, contenido sexual explícito, fraude o doxxing).

Contexto: ${context}
Contenido:
"""
${text}
"""

Responde SOLO JSON válido con formato exacto:
{
  "allowed": true,
  "severity": "low|medium|high",
  "reason": "explicación breve y concreta (máximo 16 palabras)",
  "sanitizedText": "texto limpio listo para publicar"
}`;

    const deterministicFallback = () => {
      const lowered = text.toLowerCase();
      const blockedPatterns = [
        "matar",
        "asesinar",
        "violación",
        "suicid",
        "doxx",
        "extors",
      ];
      const hasBlockedPattern = blockedPatterns.some((pattern) => lowered.includes(pattern));
      const sanitizedText = text.replace(/\s+/g, " ").trim();

      if (hasBlockedPattern) {
        return {
          allowed: false,
          severity: "high",
          reason: "El contenido incluye patrones de riesgo alto para la comunidad.",
          sanitizedText,
        };
      }

      return {
        allowed: true,
        severity: "low",
        reason: "Contenido apto para publicación.",
        sanitizedText,
      };
    };

    try {
      const result = await withTimeout(
        runAiJson(prompt, 300, moderationModel) as Promise<{ allowed?: unknown; severity?: unknown; reason?: unknown; sanitizedText?: unknown }>,
        7000,
        "Tiempo de espera agotado en moderación IA",
      );

      const parsed = {
        allowed: typeof result.allowed === "boolean" ? result.allowed : true,
        severity:
          result.severity === "high" || result.severity === "medium" || result.severity === "low"
            ? result.severity
            : "low",
        reason:
          typeof result.reason === "string" && result.reason.trim().length > 0
            ? polishAiText(result.reason)
            : "Moderación completada.",
        sanitizedText:
          typeof result.sanitizedText === "string" && result.sanitizedText.trim().length > 0
            ? polishAiText(result.sanitizedText, true)
            : polishAiText(text, true),
      };

      return res.json(parsed);
    } catch (aiError) {
      console.warn("[AI Moderation] Fallo IA, usando fallback:", (aiError as Error).message);
      return res.json(deterministicFallback());
    }
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    console.error("[AI Moderation]", err);
    return res.status(500).json({ error: "Error moderando contenido" });
  }
});

// POST /api/ai/pitch — genera pitch de startup
router.post("/pitch", authenticate, async (req: AuthRequest, res: Response) => {
  const pitchModel = process.env.OLLAMA_MODEL_PITCH || process.env.OLLAMA_MODEL || "llama3.1:8b";
  const schema = z.object({
    name: z.string().min(2),
    description: z.string().min(10),
    stage: z.string().optional(),
    sector: z.string().optional(),
    roles: z.array(z.string()).optional(),
  });

  try {
    const data = schema.parse(req.body);

    const rolesList = data.roles?.filter(r => r.trim()).join(", ") || "";
    const prompt = `Genera un pitch corto y claro (máx 80 palabras) para una startup.

Datos:
- Nombre: ${data.name}
- Sector: ${data.sector || "Sin sector"}
- Etapa: ${data.stage || "No especificada"}
- Roles buscados: ${rolesList || "No especificados"}

Descripción base:
${data.description}

Responde en JSON con:
{
  "title": "nombre del proyecto corregido ortográficamente, sin inventar otro nombre",
  "industry": "industria corregida ortográficamente (si aplica)",
  "tagline": "frase de una línea muy concreta",
  "pitch": "párrafo breve convincente",
  "cta": "llamado a la acción para atraer cofounders o talento"
}

Reglas:
- Mantén español LATAM natural, ortografía impecable y puntuación correcta.
- No inventes información fuera de los datos enviados.
- Devuelve exclusivamente JSON válido, sin markdown.`;

    const parsed = await withTimeout(
      runAiJson(prompt, 400, pitchModel),
      30000,
      "Tiempo de espera agotado generando pitch IA",
    );

    if (!parsed || typeof parsed !== "object") {
      return res.status(502).json({ error: "La IA devolvió una respuesta inválida para el pitch" });
    }

    const typed = parsed as Record<string, unknown>;
    const title = typeof typed.title === "string" && typed.title.trim() ? polishAiText(typed.title) : "";
    const industry = typeof typed.industry === "string" && typed.industry.trim() ? polishAiText(typed.industry) : "";
    const tagline = typeof typed.tagline === "string" && typed.tagline.trim() ? polishAiText(typed.tagline) : "";
    const pitch = typeof typed.pitch === "string" && typed.pitch.trim() ? polishAiText(typed.pitch) : "";
    const cta = typeof typed.cta === "string" && typed.cta.trim() ? polishAiText(typed.cta) : "";

    if (!tagline || !pitch || !cta) {
      return res.status(502).json({ error: "La IA devolvió una respuesta incompleta para el pitch" });
    }

    return res.json({ title, industry, tagline, pitch, cta });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    if (err instanceof Error) {
      console.error("[AI Pitch]", err.message);
      return res.status(502).json({ error: err.message || "Error del proveedor IA generando pitch" });
    }
    console.error("[AI Pitch]", err);
    res.status(500).json({ error: "Error generando pitch" });
  }
});

export default router;
