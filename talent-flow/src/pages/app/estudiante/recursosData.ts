import { BookOpen, Play, FileText, Compass } from "lucide-react";

export type ResourceCard = {
  id: string;
  title: string;
  type: "Guía" | "Práctica" | "Ruta";
  duration: string;
  ctaLabel: string;
  to: string;
  icon: typeof FileText;
  intro: string;
  steps: string[];
};

export const buildDynamicResources = (
  profileCompletion: number,
  activeApplications: number,
  savedCount: number,
  internshipsCount: number
): ResourceCard[] => {
  return [
    {
      id: "perfil",
      title: profileCompletion < 70
        ? "Checklist para subir tu perfil al 80%"
        : "Optimiza tu headline para atraer reclutadores",
      type: "Guía",
      duration: "8 min",
      ctaLabel: "Ir a perfil",
      to: "/app/estudiante/perfil",
      icon: FileText,
      intro: profileCompletion < 70
        ? "Tu perfil todavía puede mejorar bastante visibilidad si completas datos clave."
        : "Tu perfil ya está bien, ahora toca optimizarlo para convertir más entrevistas.",
      steps: profileCompletion < 70
        ? [
            "Completa headline con rol objetivo + stack principal.",
            "Escribe bio en 4-5 líneas: qué sabes, en qué destacas, qué buscas.",
            "Agrega mínimo 6 skills reales y actuales.",
            "Sube CV en PDF y aplica cambios sugeridos por IA.",
            "Verifica ubicación y disponibilidad para prácticas.",
          ]
        : [
            "Refina headline para un nicho concreto (ej. Backend Node Junior).",
            "Aterriza logros en la bio con resultados medibles.",
            "Ordena skills por prioridad para vacantes de práctica.",
            "Ajusta CV con palabras clave de vacantes activas.",
            "Actualiza el perfil cada semana con avances recientes.",
          ],
    },
    {
      id: "practicas",
      title: internshipsCount > 0
        ? `Estrategia para aplicar a ${Math.min(internshipsCount, 10)} prácticas esta semana`
        : "Cómo encontrar prácticas cuando hay pocas vacantes activas",
      type: "Ruta",
      duration: "12 min",
      ctaLabel: "Ver prácticas",
      to: "/app/estudiante/practicas",
      icon: Compass,
      intro: internshipsCount > 0
        ? "Hay oportunidades activas. El objetivo es aplicar con foco, no en volumen ciego."
        : "Aunque hoy haya pocas vacantes, puedes preparar aplicaciones de alto impacto.",
      steps: internshipsCount > 0
        ? [
            "Filtra prácticas por modalidad y stack que sí dominas.",
            "Elige un máximo de 5-10 vacantes con match real.",
            "Adapta CV y pitch corto por cada práctica prioritaria.",
            "Aplica primero a vacantes recientes (publicadas esta semana).",
            "Haz seguimiento diario en la sección Aplicaciones.",
          ]
        : [
            "Define 3 roles objetivo de práctica para no dispersarte.",
            "Mejora CV y perfil con palabras clave de esos roles.",
            "Guarda vacantes similares para aplicar cuando abran.",
            "Conecta con mentores para validar tu estrategia.",
            "Activa alertas revisando la sección prácticas a diario.",
          ],
    },
    {
      id: "aplicaciones",
      title: activeApplications > 0
        ? "Seguimiento de aplicaciones: cómo pasar de screening a entrevista"
        : "Primeras postulaciones: guía para no aplicar sin estrategia",
      type: "Práctica",
      duration: "10 min",
      ctaLabel: "Ver aplicaciones",
      to: "/app/estudiante/aplicaciones",
      icon: Play,
      intro: activeApplications > 0
        ? "Ya tienes procesos activos: toca mejorar tasa de avance entre etapas."
        : "Primero necesitas una base mínima de aplicaciones para generar tracción.",
      steps: activeApplications > 0
        ? [
            "Revisa el estado de cada proceso y ordénalos por prioridad.",
            "Prepara respuestas base para preguntas de screening.",
            "Ten lista una historia de proyecto con problema, acción y resultado.",
            "Practica entrevista técnica y de comportamiento 2 veces por semana.",
            "Retira aplicaciones que ya no te interesen para mantener foco.",
          ]
        : [
            "Define meta de 3 aplicaciones de calidad por semana.",
            "Prepara una carta breve reutilizable y adaptable.",
            "Empieza por vacantes con requisitos junior/intern claros.",
            "Evita aplicar si no cumples al menos 60% de requisitos.",
            "Mide semanalmente: aplicaciones enviadas vs respuestas.",
          ],
    },
    {
      id: "guardados",
      title: savedCount > 0
        ? `Convierte tus ${savedCount} vacantes guardadas en postulaciones efectivas`
        : "Método para guardar vacantes con alto potencial",
      type: "Guía",
      duration: "7 min",
      ctaLabel: "Ir a prácticas",
      to: "/app/estudiante/practicas",
      icon: BookOpen,
      intro: savedCount > 0
        ? "Guardar vacantes sirve solo si las conviertes en acciones con fecha límite."
        : "Guardar con criterio te ayuda a crear un pipeline de prácticas de calidad.",
      steps: savedCount > 0
        ? [
            "Revisa tus guardados y clasifícalos en alta/media prioridad.",
            "Descarta vacantes antiguas o fuera de tu enfoque.",
            "Define fecha límite de postulación por vacante.",
            "Adapta CV para las 3 vacantes más relevantes.",
            "Postula hoy al menos a una vacante guardada.",
          ]
        : [
            "Guarda solo vacantes que encajen con tu objetivo actual.",
            "Evita acumular más de 15 sin plan de aplicación.",
            "Anota por qué cada vacante te conviene.",
            "Marca las 3 primeras para aplicar esta semana.",
            "Repite el ciclo semanal de guardar, priorizar y aplicar.",
          ],
    },
  ];
};
