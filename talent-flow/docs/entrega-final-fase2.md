# Joblify — FASE 2: Diseño

---

## 3.1 Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENTE (Browser)                     │
│          React 18 + Vite + TailwindCSS + Zustand        │
│                  TanStack Query (cache)                  │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS / REST API
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  BACKEND (Node.js 20)                    │
│          Express 4 + TypeScript + Prisma ORM            │
│    ┌──────┐  ┌──────────┐  ┌───────┐  ┌──────────┐    │
│    │ Auth │  │  Routes   │  │  AI   │  │ Services │    │
│    │ JWT  │  │ (14 mods) │  │Ollama │  │  Email   │    │
│    └──────┘  └──────────┘  └───────┘  └──────────┘    │
└──────────────────────┬──────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
   ┌────────────┐ ┌─────────┐ ┌──────────┐
   │ PostgreSQL │ │ Ollama  │ │ SendGrid │
   │  (Prisma)  │ │  Local  │ │ / Gmail  │
   │  Supabase  │ │ llama3  │ │  (SMTP)  │
   └────────────┘ └─────────┘ └──────────┘
```

**Patrón:** Monorepo con dos proyectos (`backend/` y `talent-flow/`) conectados por API REST.

## 3.2 Stack Tecnológico

### Frontend (`talent-flow/`)

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | React + Vite | 18.3 / 5.4 |
| Lenguaje | TypeScript | 5.8 |
| Estilos | Tailwind CSS | 3.4 |
| Componentes UI | shadcn/ui (Radix UI) | Última |
| Iconos | Lucide React | 0.462 |
| Estado global | Zustand (persist) | 4.5 |
| Data fetching | TanStack React Query | 5.83 |
| HTTP Client | Axios | 1.7 |
| Routing | React Router DOM | 6.30 |
| Formularios | React Hook Form + Zod | 7.61 / 3.25 |
| Animaciones | Framer Motion | 12.38 |
| Charts | Recharts | 2.15 |
| Notificaciones | Sonner | 1.7 |
| Testing | Vitest + Testing Library + jsdom | 3.2 |

### Backend (`backend/`)

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Runtime | Node.js | 20 LTS |
| Framework | Express | 4.19 |
| Lenguaje | TypeScript | 5.4 |
| ORM | Prisma Client | 5.14 |
| Base de datos | PostgreSQL (Supabase) | 16 |
| Auth | JWT (HS256) + bcryptjs | 9.0 / 2.4 |
| OAuth | Passport.js + Google Strategy | 0.7 / 2.0 |
| Validación | Zod | 3.23 |
| Email | Nodemailer (Gmail) + SendGrid | 6.9 / 8.1 |
| IA | Ollama local (fetch) | — |
| CV parsing | pdf-parse | 1.1 |
| Upload | Multer | 1.4 |
| Seguridad | Helmet + express-rate-limit + CORS | — |

### IA Local (Ollama)

| Modelo | Uso | Params |
|--------|-----|--------|
| `llama3.1:8b` | Chat, pitch, job draft, mejora perfil | 8B |
| `qwen2.5:3b` | Match, recomendaciones, fallback | 3B |
| `phi3:mini` | Moderación de contenido | 3.8B |

## 3.3 Modelo de Datos (24 modelos Prisma)

### Diagrama de Relaciones

```
User ──1:N──> Job (poster)
User ──1:N──> Application (applicant)
User ──1:N──> FreelanceService
User ──1:N──> Startup (founder)
User ──1:N──> Post (author)
User ──1:N──> Message (sender/receiver)
User ──M:N──> Skill (via UserSkill)
User ──1:N──> Experience / Education / Certification
User ──M:N──> User (via Follow)

Job ──M:N──> Skill (via JobSkill)
Job ──1:N──> Application
Job ──N:1──> JobCategory

Application ──1:N──> PreInterviewAnswer

Startup ──1:N──> StartupRole ──1:N──> CofounderApplication

FreelanceProject ──1:N──> Proposal
FreelanceProject ──1:1──> Escrow
FreelanceProject ──1:N──> Review

Post ──1:N──> PostLike / Comment
Conversation ──1:N──> Message
Conversation ──M:N──> User (via ConversationParticipant)
```

### Enums

```
Role:              CANDIDATO | EMPRESA | FREELANCER | EMPRENDEDOR | ESTUDIANTE | MENTOR
JobType:           FULL_TIME | PART_TIME | FREELANCE | PASANTIA
Modality:          REMOTO | HIBRIDO | PRESENCIAL
ApplicationStatus: APLICADO | SCREENING | ENTREVISTA | OFERTA | CONTRATADO | RECHAZADO
ProjectStatus:     ACTIVO | PAUSADO | COMPLETADO | CANCELADO
EscrowStatus:      PENDIENTE | LIBERADO | DISPUTADO | REEMBOLSADO
PlanType:          FREE | PRO | EMPRESA
ConversationRequestStatus: OPEN | PENDING | REJECTED
```

### Modelos (resumen de campos clave)

| Modelo | Campos clave |
|--------|-------------|
| User | email, role, profileData (JSON), profileCompletion, googleId |
| Job | title, modality, type, salaryMin/Max, skills, category |
| Application | status (6 estados), matchScore, aiExplanation, cvUrl |
| FreelanceService | title, priceMin/Max, deliveryDays, portfolio |
| FreelanceProject | budget, status, deadline, escrow |
| Startup | name, tagline, stage, sector, openRoles |
| StartupRole | title, equityMin/Max, isOpen |
| CofounderApplication | motivation, status |
| Post | content, imageUrl, tag, likes, comments |
| Message | content, isRead, conversation |
| Notification | type, title, body, isRead |

## 3.4 Diseño de API REST (14 módulos)

**Base URL:** `/api` — Autenticación: `Authorization: Bearer <JWT>`

### Auth (`/api/auth`)
```
POST /register         POST /login            POST /verify-email
POST /resend-verification  POST /logout       POST /refresh
POST /forgot-password  POST /reset-password   GET  /me
GET  /google           GET  /google/callback
```

### Users (`/api/users`)
```
GET  /me              PUT  /me              GET  /me/stats
GET  /work-areas      GET  /                GET  /public
GET  /:id             GET  /:id/follow-status  POST /:id/follow
POST /me/skills       PUT  /me/skills
POST /me/experience   PUT  /me/experience/:id   DELETE /me/experience/:id
POST /me/education    PUT  /me/education/:id    DELETE /me/education/:id
```

### Jobs (`/api/jobs`)
```
GET  /                GET  /my/posted       GET  /:id
POST /                PUT  /:id
```

### Applications (`/api/applications`)
```
POST /                GET  /my              GET  /job/:jobId
PATCH /:id/status     DELETE /:id
POST /:id/cv-event    POST /:id/analysis    POST /job/:jobId/close
```

### Freelance (`/api/freelance`)
```
GET  /me/profile      GET  /my/services     POST /services
PUT  /services/:id    DELETE /services/:id
GET  /projects        POST /projects/:id/proposals
GET  /my/proposals    GET  /my/earnings     GET  /reviews/:id
```

### Startups (`/api/startups`)
```
GET  /                GET  /my/owned        GET  /my/overview
GET  /my/applications GET  /:id
POST /                PUT  /:id             DELETE /:id
POST /:id/roles       PATCH /roles/:id      DELETE /roles/:id
POST /:id/apply       PATCH /applications/:id/status
```

### Messages (`/api/messages`)
```
GET  /contacts        GET  /conversations   GET  /conversations/:id
PATCH /conversations/:id/request            POST /
```

### Feed (`/api/feed`)
```
GET  /                GET  /public          GET  /user/:id
POST /                POST /:id/like
GET  /:id/comments    POST /:id/comments
```

### AI (`/api/ai`)
```
POST /chat            POST /pitch           POST /job-draft
POST /match           POST /improve-profile POST /moderate-content
GET  /recommendations
```

### Notifications, Saved, Companies, Profile
```
GET  /notifications          PATCH /notifications/read-all
GET  /saved/jobs             POST  /saved/jobs/:id
GET  /saved/posts            POST  /saved/posts/:id
GET  /companies/:id
POST /profile/upload-cv
```

## 3.5 Diseño Visual (Design System)

### Identidad
- **Concepto:** Minimalista Apple — moderno, profesional, limpio
- **Tipografía:** DM Sans (títulos) + Montserrat (cuerpo)
- **Accent:** Amarillo #FFCC00

### Tokens de Diseño (CSS Variables HSL)

| Token | Valor |
|-------|-------|
| Background | 0 0% 100% (blanco) |
| Surface elevated | 0 0% 96% |
| Foreground | 0 0% 9% (near-black) |
| Primary | 48 100% 50% (amarillo) |
| Primary hover | 45 100% 45% |
| Success | 142 71% 45% |
| Warning | 38 92% 50% |
| Destructive | 0 84% 60% |
| Info | 217 91% 60% |
| Border | 0 0% 86% |

### Componentes UI
- **49 componentes shadcn/ui** (basados en Radix UI)
- Iconos: Lucide React
- Animaciones: Framer Motion + keyframes CSS (accordion, fade-in, marquee)

### Layout
- Navbar superior fija (logo + nav + user actions)
- Sidebar lateral por rol en rutas `/app/*`
- Responsive: mobile-first, breakpoints 768px / 1024px

## 3.6 Mapa de Navegación

### Rutas Públicas (10)
```
/                  → Landing
/login             → Login
/register          → Registro multi-rol
/onboarding        → Wizard post-registro
/auth/callback     → Google OAuth callback
/forgot-password   → Recuperar contraseña
/reset-password    → Restablecer contraseña
/vacantes          → Explorar vacantes
/vacantes/:id      → Detalle vacante
/freelancers       → Directorio freelancers
/empresa           → Directorio empresas
/empresa/:id       → Detalle empresa
/comunidad         → Feed público
```

### Rutas Autenticadas por Rol

**Talento** (`/app/talento/`): vacantes, aplicaciones, guardados, perfil, mensajes, config  
**Empresa** (`/app/empresa/`): dashboard, vacantes, candidatos, pipeline, publicar, mensajes  
**Freelancer** (`/app/freelancer/`): proyectos, propuestas, perfil, mensajes  
**Startup** (`/app/startup/`): proyectos, cofounders, postulantes, publicar, mensajes  
**Estudiante** (`/app/estudiante/`): dashboard, prácticas, recursos, aplicaciones, mensajes

## 3.7 Diseño del Motor de IA

### Routing de Modelos

| Endpoint | Variable ENV | Modelo Default |
|----------|-------------|----------------|
| /ai/chat | OLLAMA_MODEL_CHAT | llama3.1:8b |
| /ai/pitch | OLLAMA_MODEL_PITCH | llama3.1:8b |
| /ai/match | OLLAMA_MODEL_MATCH | qwen2.5:3b |
| /ai/moderate-content | OLLAMA_MODEL_MODERATION | phi3:mini |
| /ai/job-draft | OLLAMA_MODEL_CHAT | llama3.1:8b |
| /ai/improve-profile | OLLAMA_MODEL_CHAT | llama3.1:8b |
| /ai/recommendations | OLLAMA_MODEL_MATCH | qwen2.5:3b |

### Flujo de Ejecución
```
Request → Seleccionar modelo (env) → Ollama API → Si OOM → Retry con low-memory model
                                                         → polishAiText() (normalización)
                                                         → JSON response
```

### Normalización Lingüística
- `capitalizeFirstAlpha()` — Primera letra mayúscula
- `polishAiInlineText()` — Espacios, puntuación, capitalización
- `polishAiText()` — Párrafos completos

Se aplica a: chat, match explanations, profile suggestions, recommendations, moderation, job drafts, pitch.
