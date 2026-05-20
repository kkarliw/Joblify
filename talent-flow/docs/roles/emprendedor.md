---
role: emprendedor
status: completado
updated_at: 2026-05-20
owner: equipo-producto
---

# Rol Emprendedor — Implementación (v1)

Este documento resume lo implementado para el flujo **Emprendedor / Startup** en Joblify y sirve como referencia para QA, soporte y futuras iteraciones.

## 1) Objetivo funcional

Habilitar a los emprendedores para **publicar su startup**, gestionar roles abiertos (cofundadores/colaboradores), recibir postulaciones reales y apoyarse en IA para pulir su pitch.

## 2) Alcance entregado

### CRUD de Startups reales
- Alta/edición/archivo de startups con `name`, `tagline`, `description`, `stage`, `sector`, `website`, `deckUrl`, `logoUrl`.
- Validaciones Zod (mínimos de campos y mensajes claros).
- Control de ownership: cada startup pertenece al founder autenticado.

### Roles abiertos y equity
- Crear roles con `title`, `description`, `equityMin`, `equityMax`, `isOpen`.
- Editar/cerrar roles individuales sin duplicar la startup completa.
- Roles ordenados por `createdAt desc` (tipado estricto via `Prisma.validator`).

### Postulaciones de cofundadores
- Cualquier usuario autenticado puede aplicar indicando motivación.
- Founder gestiona estados `PENDIENTE → EN_REVISION → ACEPTADO / RECHAZADO`.
- Contador de postulaciones por rol y métricas agregadas en overview.

### Búsqueda de cofundadores (lado Emprendedor)
- Listado filtrado por rol/foco (freelancer, candidato, estudiante, mentor) con normalización de mayúsculas para evitar mezcla.
- Usuarios demo (`@demo.joblify.io`) excluidos de resultados.

### Pitch asistido por IA
- Endpoint `POST /api/ai/pitch` exclusivo para startups.
- Flujo obliga a respuesta de IA (sin fallback local). Si Ollama falla → error claro.
- Salida normalizada (ortografía, puntuación) y guarda tagline/pitch/CTA sugerido.

### Paneles en frontend
- Dashboard de startup con métricas (número de roles, postulaciones, match rate, estado activo/inactivo).
- Listado de proyectos propios + acceso rápido a publicar/duplicar.
- Detalle de proyecto con tabs (Overview, Roles, Postulantes, Pitch IA).
- Lista de postulantes con badges de estado, notas y acciones rápidas.

## 3) Backend relacionado

Archivo principal: `backend/src/routes/startup.routes.ts`

Endpoints claves:
- `GET /api/startups` (listado público con filtros `stage`, `q`).
- `GET /api/startups/my/owned`, `GET /api/startups/my/overview`, `GET /api/startups/my/applications`.
- `POST /api/startups`, `PUT /api/startups/:id`, `DELETE /api/startups/:id`.
- `POST /api/startups/:id/roles`, `PATCH /api/startups/roles/:roleId`, `DELETE /api/startups/roles/:roleId`.
- `POST /api/startups/:id/apply`, `PATCH /api/startups/applications/:id/status`.

Complementos backend:
- `backend/src/routes/ai.routes.ts` → handler `POST /api/ai/pitch` con routing de modelo `OLLAMA_MODEL_PITCH`.
- `backend/src/routes/user.routes.ts` → exclusión de cuentas demo en búsquedas públicas.

## 4) Frontend tocado

| Archivo | Descripción |
|---------|-------------|
| `src/pages/app/startup/StartupProyectos.tsx` | Listado de startups del founder + CTA "Publicar".
| `src/pages/app/startup/StartupProyectoDetalle.tsx` | Tabs Overview/Roles/Postulantes/Pitch IA, métricas y acciones.
| `src/pages/app/startup/StartupPublicar.tsx` | Form real conectado a `startupApi.create`, pitch IA obligatorio, loader/errores claros.
| `src/pages/app/startup/StartupCofounders.tsx` | Explorador de talento filtrado (roles válidos upper-case, exclusión demos).
| `src/pages/app/startup/StartupPostulantes.tsx` | Panel de aplicaciones con filtros por estado, acciones inline.
| `src/components/AppAssistantWidget.tsx` | Disponible también para emprendedores (context `career_advice`).
| `src/lib/api.ts` | Cliente `startupApi` completo (list, my, overview, roles, applications).

## 5) QA y checklist

- [x] Crear/editar/archivar startup solo por su owner.
- [x] Roles listados en orden descendente y reflejan `isOpen`.
- [x] Postulaciones muestran motivación, datos del usuario y permiten cambiar estado.
- [x] `StartupCofounders` solo muestra usuarios de roles permitidos (sin mezclas).
- [x] Pitch IA no tiene fallback: si IA falla, se muestra error y no se guarda basura.
- [x] Overview refleja totales reales desde `GET /api/startups/my/overview`.
- [x] Permisos validados (empresa/freelancer/etc. no pueden tocar endpoints de startup).

## 6) Pendientes / riesgos

- Falta integración de notificaciones push cuando llega nueva postulación (solo aparece en panel).
- No hay paginación server-side en listas de cofounders; dependerá de dataset real.
- Moderación IA de descripciones/pitch se deja para fase de hardening (se usa el flujo genérico si se llama manualmente).
- Landing aún no tiene sección dedicada a startups; se sugiere agregar CTA específica.

---

Con este documento se completa la carpeta `docs/roles/` para todas las experiencias activas (candidato, talento, freelancer, empresa, estudiante y emprendedor).
