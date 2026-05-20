---
role: estudiante
status: completado
updated_at: 2026-05-18
owner: equipo-producto
---

# Rol Estudiante — Documentación v1

## Fase 1 · Levantamiento de requerimientos
- Reemplazar mockups de prácticas por datos reales provenientes de `jobsApi.list`.
- Replicar la experiencia del mock (hero + filtros laterales + cards de pasantías) con énfasis en claridad salarial.
- Permitir aplicar en un clic (usa `applicationsApi.applyWithDocuments`).
- Proveer métricas de contexto (vacantes activas, empresas participando, porcentaje verificado).
- Mantener orden UX "Apple x LinkedIn": tipografía Inter, espaciado 8px, colores suaves.

## Fase 2 · Diseño de experiencia
- Header "Encuentra tu primera oportunidad" con métricas en un grid responsive.
- Buscador principal + barra de acciones (Filtros, Ordenar) sticky.
- Sidebar de filtros con estados persistentes: tipo empleo, modalidad, salario (slider), áreas, tecnologías, nivel.
- Cards de prácticas a una columna (desktop) con jerarquía: empresa, badge verificación, salary pill, metadatos (modalidad, tipo, duración), chips de skills y CTA (Ver detalle / Aplicar ahora).
- Estado vacío claro para búsquedas sin resultados.

## Fase 3 · Desarrollo
### Datos / backend
- Reutiliza `GET /api/jobs` con parámetros (`limit`, `sort`).
- Filtros en frontend sobre payload ya procesado (detecta si es pasantía por keywords).
- Métricas calculadas localmente (vacantes activas, empresas únicas, % verificadas, total de applications).

### Frontend (`talent-flow/src/pages/app/estudiante/Practicas.tsx`)
- Hook principal con React Query (`jobsApi.list`).
- Normalización del payload a `InternshipItem` (stipend, skills, modality, recruiter).
- Barra de búsqueda con `useState` + memorias para filtros seleccionados.
- Sidebar sticky con componentes accesibles (`aria-label`, `title`).
- Cards premium con salary band, chips, toggle Guardar, CTA `Aplicar ahora` (usa `applicationsApi.applyWithDocuments`).
- Estados `loading`, `empty`, `saved`, `applying` con feedback a usuario.

### Integraciones / IA
- Preparado para añadir resumen IA por vacante (placeholder `preview`). Cuando se integre Ollama, se usará `job.description` como prompt base para destacar insights.

## QA y checklist
- [x] Tablero copia el mock (estructura, métricas, cards).
- [x] Datos conectados al backend real.
- [x] Filtros funcionales y combinables.
- [x] CTA de aplicación usa endpoint real y bloquea duplicados.
- [x] Guardado local de favoritos (`savedJobs`).

## Pendientes
1. Exponer en backend un endpoint dedicado a prácticas (`type=PASANTIA`) para evitar heurísticas.
2. Añadir analíticas (events) para interacciones en filtros.
3. Conectar módulo IA de recomendaciones personalizadas (cuando esté listo el servicio de matching).
