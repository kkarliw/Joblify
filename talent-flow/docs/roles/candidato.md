---
role: candidato
status: completado
updated_at: 2026-05-13
owner: equipo-producto
---

# Rol Candidato — Implementación (v1)

Este documento resume lo implementado para el panel de **candidato** en Joblify. La idea es que, al cerrar los demás roles, solo haya que consolidar todos los archivos de `docs/roles/` en una documentación final única.

## 1) Objetivo funcional

Se dejó el perfil de candidato dinámico, editable y sincronizado con backend, reemplazando datos mock por datos reales.

## 2) Alcance entregado

### Perfil dinámico
- Carga de perfil real desde `GET /api/users/me`.
- Edición de `name`, `headline`, `bio`, `location`, `workArea`.
- Guardado de perfil con `PUT /api/users/me`.

### Skills (sincronización real)
- Edición visual de skills (agregar/quitar chips).
- Sincronización completa (replace) con `PUT /api/users/me/skills`.
- Evita inconsistencias entre UI y BD al eliminar skills.

### Experiencia (CRUD funcional)
- Crear experiencia: `POST /api/users/me/experience`.
- Editar experiencia inline: `PUT /api/users/me/experience/:id`.
- Eliminar experiencia: `DELETE /api/users/me/experience/:id`.
- Se corrigió limpieza de `endDate` cuando `current=true` (guarda `null` correctamente).

### UX en edición
- Ciudad: autocomplete custom (sin `datalist` nativo).
- Área de trabajo: combobox buscable con sugerencias.
- Dropdowns corregidos para no recorte (`overflow` + `max-height` + scroll).
- Formulario de experiencia más guiado (preguntas/labels claros).
- Descripción y ubicación visibles en tarjetas de experiencia.

### CV + IA
- Flujo de carga de CV con progreso visual.
- Botones explícitos para aplicar/descartar cambios sugeridos por IA.

### Sidebar de métricas
- Se reemplazó contenido estático por datos reales.
- Nuevo endpoint: `GET /api/users/me/stats`.
- Match score y logros condicionados por datos reales (`isVerified`, conexiones, score).

## 3) Endpoints backend agregados/actualizados

Archivo principal: `backend/src/routes/user.routes.ts`

### Nuevos
- `GET /api/users/work-areas`
- `GET /api/users/me/stats`
- `PUT /api/users/me/skills`
- `PUT /api/users/me/experience/:id`
- `DELETE /api/users/me/experience/:id`

### Ajustes relevantes
- `PUT /api/users/me`: respuesta optimizada para payload más liviano.
- Query de áreas corregida para tabla real (`users`).
- Optimización de sync skills en batch (`findMany/createMany`), evitando múltiples upserts individuales.

## 4) Frontend tocado

### `talent-flow/src/pages/app/shared/ProfilePage.tsx`
- Datos dinámicos de skills/experiencia.
- Edición de nombre y demás campos del header.
- Combobox de área + autocomplete de ciudad.
- CRUD de experiencia con formulario inline de edición.
- Visualización de descripción/ubicación en experiencia.
- Bloque de métricas dinámico (match/logros).

### `talent-flow/src/lib/api.ts`
- Métodos agregados:
  - `userApi.getWorkAreas()`
  - `userApi.getMyStats()`
  - `userApi.syncSkills()`
  - `userApi.updateExperience()`
  - `userApi.deleteExperience()`
- Timeouts ajustados para requests pesadas de perfil.

### `talent-flow/src/store/authStore.ts`
- Persistencia reducida para evitar `localStorage quota exceeded`.
- Se guardan solo campos livianos del usuario.

## 5) Performance y estabilidad

### Mejoras aplicadas
- Menos carga en auth middleware (se eliminó lookup a BD por cada request autenticada).
- Ajustes de timeout en frontend para evitar falsos errores por latencia.
- Menor payload en respuestas de update de perfil.

### Configuración de conexión
- En `backend/.env` se añadió:
  - `connection_limit=15`
  - `pool_timeout=30`

> Nota: si vuelve a haber saturación por entorno/red de Supabase, revisar pool y concurrencia de requests en paralelo.

## 6) Riesgos / pendientes conocidos

- Warnings de React Router v7 future flags (informativos, no bloqueantes).
- Si el backend no se reinicia tras cambios de rutas, pueden aparecer 404 falsos en endpoints nuevos.

## 7) Checklist de cierre del rol candidato

- [x] Perfil dinámico y editable
- [x] Skills sincronizadas (alta/baja)
- [x] Experiencia crear/editar/eliminar
- [x] UX de ciudad/área mejorada
- [x] Métricas sidebar reales
- [x] Fixes de performance/pool
- [x] Fix de quota localStorage

## 8) Estructura sugerida para próximos roles

Crear un archivo por rol en esta misma carpeta:

- `docs/roles/empresa.md`
- `docs/roles/freelancer.md`
- `docs/roles/emprendedor.md`
- `docs/roles/estudiante.md`

Al final, consolidar todos en un único documento maestro (`docs/roles/README.md` o `docs/entrega-final.md`).
