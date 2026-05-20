# Joblify — Documentación de Proyecto (v2026-05-18)

Este documento consolida el estado del proyecto después de cerrar los roles **Candidato, Talento, Estudiante, Empresa y Freelancer**. El rol **Emprendedor** continúa en mock y no forma parte de esta entrega.

---

## 1. Fase de Levantamiento de Requerimientos

| Dominio | Necesidad detectada |
| --- | --- |
| Matching interno | Usuarios autenticados no deben saltar a rutas públicas; toda navegación debe respetar `/app/<rol>/...`. |
| Datos reales | Eliminar placeholders en perfiles, listados y métricas; todo debe venir de PostgreSQL vía Prisma. |
| Flujo de postulaciones | Candidatos/Talento requieren seguimiento de procesos con timeline, métricas y acciones (retirar, ver historial). |
| Empresas | Presentación pública premium con métricas, cultura, beneficios, enlaces reales y tabs navegables. |
| Estudiantes | Catálogo de prácticas con filtros avanzados, métricas y CTA "Aplicar ahora" usando los endpoints reales. |
| Freelancer | Mostrar servicios, portafolio y reseñas reales, con CRUD accesible desde frontend. |
| IA | Preparar cada módulo para incorporar resúmenes y recomendaciones generadas con Ollama (llama3.1 / qwen2.5). |

---

## 2. Fase de Diseño

- **Línea visual**: "Apple aplicado a LinkedIn" — Inter, colores neutros, espaciado base 8px, componentes suaves con sombras ligeras.
- **Patrones compartidos**: `PageHeader`, cards de vacantes, métricas en cuadrícula, tabs sticky, chips de filtros.
- **Accesibilidad**: labels y `aria-*` en filtros, botones con texto, contrastes revisados.
- **Responsive**: Breakpoints pensados para 320px+ (móvil), 768px (tablet) y desktop >1024px.
- **Motion**: transiciones cortas (`all 0.2s ease`) en cards y toggles para sensación premium.
- **IA ready**: Se reservaron bloques para insights/resúmenes (ej. card "Consejo" en Seguimiento, placeholder `preview` en prácticas).

---

## 3. Fase de Desarrollo

### 3.1 Backend (Node 20 + Express + Prisma + PostgreSQL)
- **Companies** (`backend/src/routes/company.routes.ts`): endpoint enriquecido con `companyProfile`, `stats` y `jobs` completos.
- **Jobs** (`backend/src/routes/job.routes.ts`): filtros avanzados (`q`, `location`, `skills`, `sort`) y exposición de `poster.isVerified`.
- **Applications** (`backend/src/routes/applications.routes.ts`): base para `applicationsApi.my`, `apply`, `withdraw` (ya existentes) utilizados en frontend.
- **Freelance** (`backend/src/routes/freelance.routes.ts`): CRUD de servicios, reseñas y portafolio.
- **User meta** (`backend/src/routes/user.routes.ts`): habilidades, experiencia, stats de candidato.
- **Infra**: Prisma 5 + PostgreSQL 16, `connection_limit=15`, `pool_timeout=30`.

### 3.2 Frontend (React + Vite + Tailwind)
- **Talento**: `TalentoVacantes.tsx`, `TalentoGuardados.tsx`, `TalentoAplicaciones.tsx` (filtros, guardados, timeline).
- **Estudiante**: `app/estudiante/Practicas.tsx` (catálogo estilo mock + filtros + métricas).
- **Empresa**: `EmpresaDetalle.tsx` + edición en `ProfilePage.tsx`.
- **Freelancer**: Bloques de servicios/portafolio/reseñas en `ProfilePage.tsx` + cliente `freelanceApi`.
- **Candidato**: Perfil completo con edición de skills, experiencia, CV.
- **Shared**: `PageHeader`, chips, cards, hooks React Query con `jobsApi`, `applicationsApi`, `savedApi`.

### 3.3 Integraciones IA (estado actual)
- CV candidato: flujo para subir PDF y aceptar/descartar sugerencias de IA (Ollama).
- Preparación de prompts: `preview` de vacantes/prácticas y bloques "Consejo" listos para recibir textos generados.
- Pendiente: servicios real-time de IA para Empresa/Talento (copys de cultura, insights de vacantes, timeline inteligente).

---

## 4. Roles cubiertos

| Rol | Doc | Estado |
| --- | --- | --- |
| Candidato | `docs/roles/candidato.md` | ✅ completado |
| Talento | `docs/roles/talento.md` | ✅ completado |
| Estudiante | `docs/roles/estudiante.md` | ✅ completado |
| Empresa | `docs/roles/empresa.md` | ✅ completado |
| Freelancer | `docs/roles/freelancer.md` | ✅ completado |
| Emprendedor | _sin entregar_ | ❌ mock |

---

## 5. Próximos pasos
1. **Rol Emprendedor**: migrar de mock a datos reales + documentarlo.
2. **IA**: activar resúmenes automatizados (Ollama) en Empresa, Talento y Estudiante.
3. **Observabilidad**: añadir métricas (Datadog/Sentry) para flujos recién implementados.
4. **Docs**: consolidar todo en `docs/entrega-final.md` cuando Emprendedor esté listo.

---

## 6. Cómo usar esta documentación
- Cada archivo en `docs/roles` sigue el patrón _Requerimientos → Diseño → Desarrollo → QA/Pendientes_.
- Este `docs/proyecto.md` sirve como índice maestro.
- Para nuevas features, duplicar el formato y mantener la traza por fase.
