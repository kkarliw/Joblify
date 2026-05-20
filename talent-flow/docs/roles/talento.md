h< TODO---
role: talento
status: completado
updated_at: 2026-05-18
owner: equipo-producto
---

# Rol Talento — Documentación v1

## Fase 1 · Levantamiento de requerimientos
- Navegar todo el flujo dentro de `/app/talento/**` evitando saltos a público.
- Listado de vacantes con filtros avanzados y datos 100% reales.
- Biblioteca de guardados (vacantes + posts) sincronizada con backend.
- Seguimiento de postulaciones con línea de tiempo y métricas, igual a mock provisto.
- Preparar integración IA (resumen de vacantes, insights de procesos) aunque aún no se expone públicamente.

## Fase 2 · Diseño de experiencia
- Cabecera reutilizable (`PageHeader`) con eyebrow, título y subtítulo contextual.
- Vacantes: cards de una columna, salary band, metadatos, chips y CTA (Ver detalle, Guardar, Aplicar).
- Filtros avanzados (ubicación, modalidad, tipo, salario, skills, fecha, ordenamiento) con chips de estado.
- Guardados: tabs "Vacantes" / "Posts" con tarjeta premium por vacante.
- Seguimiento: métricas superiores + cards con timeline horizontal + CTA (Retirar, Ver detalle timeline, Consejo).

## Fase 3 · Desarrollo
### Vacantes (`talent-flow/src/pages/app/talento/TalentoVacantes.tsx`)
- React Query sobre `jobsApi.list` con parámetros (`q`, `location`, `modality`, `type`, `salaryMin`, `salaryMax`, `skills`, `postedWithinDays`, `sort`).
- Normalización de datos + chips de skills + match score.
- Guardado vía `savedApi.toggleJob` y `savedApi.getJobs` (sincroniza badges).
- Aplicar usando `applicationsApi.apply`; maneja conflictos 409 (ya aplicado).

### Guardados (`TalentoGuardados.tsx`)
- Tabs controladas, `savedApi` para jobs y posts.
- Card de vacante en guardados replica diseño global, incluye CTA "Ver vacante" y botón para quitar.

### Seguimiento (`TalentoAplicaciones.tsx`)
- Query `applicationsApi.my()`.
- Normalización de timeline + detección de estado (APLICADO, SCREENING, ENTREVISTA, OFERTA, CONTRATADO, RECHAZADO) sin importar idioma.
- Métricas: Total, En proceso, Ofertas, Rechazadas.
- Card por postulación con badge, botón Retirar, timeline interactiva, historial expandible.
- Preparado para insights IA (placeholder en timeline + card "Consejo").

### Backend relacionado
- `GET /api/jobs` con filtros extendidos (vía `backend/src/routes/job.routes.ts`).
- `savedApi` (`/api/saved/jobs`, `/api/saved/posts`).
- `applicationsApi` endpoints (`/api/applications`, `/api/applications/my`, `/api/applications/:id`).

## QA y checklist
- [x] Navegación role-aware (`/app/talento/vacantes/:id`).
- [x] Filtros de vacantes sincronizan query params.
- [x] Guardados refleja estado real y vacía correctamente.
- [x] Seguimiento replica mock (cards, timeline, métricas).
- [x] Preparado para IA (futuro panel de insights).

## Pendientes
1. Resumen IA por vacante y recomendaciones (Ollama).
2. Exportar postulaciones a PDF/CSV.
3. Notificar en tiempo real cambios de estado via WebSocket.
