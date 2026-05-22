<div align="center">

<br/>

```
     ██╗ ██████╗ ██████╗ ██╗     ██╗███████╗██╗   ██╗
     ██║██╔═══██╗██╔══██╗██║     ██║██╔════╝╚██╗ ██╔╝
     ██║██║   ██║██████╔╝██║     ██║█████╗   ╚████╔╝ 
██   ██║██║   ██║██╔══██╗██║     ██║██╔══╝    ╚██╔╝  
╚█████╔╝╚██████╔╝██████╔╝███████╗██║██║        ██║   
 ╚════╝  ╚═════╝ ╚═════╝ ╚══════╝╚═╝╚═╝        ╚═╝   
```

**Plataforma de Empleo Inteligente para Latinoamérica**

*Connecting talent, companies, freelancers, entrepreneurs and students — powered by local AI*

<br/>

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-20_LTS-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-5.14-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

[![Tests](https://img.shields.io/badge/E2E_Tests-43_Passed-22C55E?style=for-the-badge&logo=playwright&logoColor=white)](#-testing)
[![SonarQube](https://img.shields.io/badge/SonarQube-Quality_Gate_Passed-22C55E?style=for-the-badge&logo=sonarqube&logoColor=white)](#-calidad-de-código--sonarqube)
[![Status](https://img.shields.io/badge/Status-MVP_Funcional-FFCC00?style=for-the-badge)](#-estado-del-proyecto)
[![License](https://img.shields.io/badge/License-MIT-6B7280?style=for-the-badge)](LICENSE)

<br/>

[✨ Características](#-características) · [🏗 Arquitectura](#-arquitectura) · [🚀 Instalación](#-instalación) · [⚙️ Variables de Entorno](#️-variables-de-entorno) · [🤖 Motor IA](#-motor-de-ia) · [🗃 Base de Datos](#-esquema-de-base-de-datos) · [🧪 Testing](#-testing) · [🔍 SonarQube](#-calidad-de-código--sonarqube)

<br/>

</div>

---

## ¿Qué es Joblify?

Joblify unifica en un solo ecosistema digital **cinco tipos de usuarios** del mercado laboral latinoamericano. A diferencia de las plataformas tradicionales basadas en filtros de palabras clave y CVs en PDF estáticos, Joblify utiliza un **motor de matching con IA completamente local (Ollama)** que analiza perfiles estructurados y genera scores de compatibilidad con explicación en lenguaje natural — sin enviar datos a APIs externas de pago.

```
┌─────────────────────────────────────────────────────────────────┐
│                        JOBLIFY MVP                              │
│                                                                 │
│   Candidato   ──┐                                               │
│   Empresa     ──┤                                               │
│   Estudiante  ──┼──► React 18 + Vite ──► Express API ──► PostgreSQL │
│   Freelancer  ──┤         (SPA)            (REST)        (Prisma) │
│   Emprendedor ──┘                    │                          │
│                                      └──► Ollama (local LLM)   │
└─────────────────────────────────────────────────────────────────┘
```

| 👤 Candidato | 🏢 Empresa | 💼 Freelancer | 🚀 Emprendedor | 🎓 Estudiante |
|:---:|:---:|:---:|:---:|:---:|
| Encuentra empleo compatible con su perfil mediante IA | Publica vacantes y obtiene ranking automático de candidatos | Gestiona servicios, propuestas y pagos con escrow | Lanza startups y busca cofundadores con pitch IA | Accede a prácticas profesionales y recursos educativos |

---

## ✨ Características

<table>
<tr>
<td width="50%">

### 🤖 Motor de IA Local
- **Matching semántico** — Score 0–100 con explicación en lenguaje natural y detección de brechas
- **Extracción de CV** — PDF → perfil estructurado de forma automática
- **Chat contextual** — Asistente flotante en toda la app (3 modos: Asesor · Evaluador · Entrevista)
- **Pitch de startup** — Tagline + pitch + CTA generado por IA
- **Borrador de vacantes** — Empresas crean ofertas desde un brief simple
- **Mejora de perfil** — Sugerencias accionables personalizadas
- **Moderación automática** — Filtrado del feed: `safe` / `warning` / `blocked`

</td>
<td width="50%">

### 💼 Módulo Empresa
- **Pipeline Kanban drag & drop** con 6 estados: `Aplicado → Evaluación → Entrevista → Oferta → Contratado → Rechazado`
- **Ranking IA** de candidatos con badges de compatibilidad por color
- **Agendamiento de entrevistas** con email automático
- **Publicación de vacantes** en pasos asistidos por IA
- **Dashboard** con métricas en tiempo real

</td>
</tr>
<tr>
<td>

### 👤 Módulo Candidato / Talento
- **Filtros avanzados** — ubicación, modalidad, salario, skills, fecha
- **Timeline de aplicaciones** — seguimiento visual de cada proceso
- **Upload de CV** con pre-llenado de perfil por IA
- **Feed personalizado** con recomendaciones basadas en perfil
- **Guardado** de vacantes y posts favoritos

</td>
<td>

### 🚀 Módulo Emprendedor
- **CRUD completo** de startups con roles y equity
- **Pitch obligatorio generado por IA** — sin texto genérico
- **Gestión de cofundadores** — postulaciones con estados
- **Búsqueda de talento** filtrada por rol y afinidad

</td>
</tr>
<tr>
<td>

### 🔐 Autenticación y Seguridad
- Registro multi-rol con formulario dinámico por tipo de usuario
- Verificación OTP de 6 dígitos (TTL: 15 min, bloqueo tras 5 intentos)
- OAuth 2.0 con Google
- JWT con Access Token (24h) + Refresh Token (7 días) en cookies `HttpOnly; Secure`
- Rotación automática de tokens (prevención de session hijacking)
- Hashing con `bcryptjs` — almacenamiento irreversible
- IDs `CUID` resistentes a ataques de enumeración

</td>
<td>

### 💸 Módulo Freelance
- Modelo **Escrow** — fondos retenidos hasta aprobación del entregable
- Marketplace de servicios freelance con verificación
- Gestión de propuestas, contratos y reseñas
- Búsqueda de cofundadores con equity negociable

</td>
</tr>
</table>

---

## 🏗 Arquitectura

```
┌──────────────────────────────────────────────────────────┐
│              CLIENTE (Browser / Mobile)                  │
│  React 18 + Vite + TailwindCSS + Zustand + shadcn/ui    │
│             TanStack Query (cache + fetch)               │
└─────────────────────┬────────────────────────────────────┘
                      │  REST API · HTTPS
                      ▼
┌──────────────────────────────────────────────────────────┐
│              BACKEND (Node.js 20 LTS)                    │
│        Express 4 · TypeScript · Prisma ORM              │
│  ┌──────────┐ ┌─────────────┐ ┌────────┐ ┌──────────┐  │
│  │ Auth JWT │ │ 14 Módulos  │ │ Ollama │ │  Email   │  │
│  │  OAuth   │ │  REST API   │ │   IA   │ │ Service  │  │
│  └──────────┘ └─────────────┘ └────────┘ └──────────┘  │
└──────────┬───────────────────────────────────────────────┘
           │
    ┌──────┴────────────────────┐
    ▼                           ▼
┌──────────┐        ┌────────────────────────────────────┐
│PostgreSQL│        │          Ollama Local              │
│ Prisma 5 │        │  llama3.1:8b · qwen2.5:3b ·       │
│  24 tbls │        │           phi3:mini                │
└──────────┘        └────────────────────────────────────┘
```

**Patrón:** Monorepo · `backend/` + `frontend/` · API REST · Sin microservicios

### Stack Tecnológico

#### Frontend (`talent-flow/`)

| Categoría | Tecnología | Versión |
|-----------|-----------|---------|
| Framework | React + Vite | 18.3 / 5.4 |
| Lenguaje | TypeScript | 5.8 |
| Estilos | Tailwind CSS | 3.4 |
| Componentes | shadcn/ui (Radix UI) — 49 componentes | Latest |
| Estado global | Zustand (persist) | 4.5 |
| Data fetching | TanStack React Query | 5.83 |
| Routing | React Router DOM | 6.30 |
| Formularios | React Hook Form + Zod | 7.61 / 3.25 |
| Animaciones | Framer Motion | 12.38 |
| Testing E2E | Playwright | Latest |

#### Backend (`backend/`)

| Categoría | Tecnología | Versión |
|-----------|-----------|---------|
| Runtime | Node.js | 20 LTS |
| Framework | Express | 4.19 |
| Lenguaje | TypeScript | 5.4 |
| ORM | Prisma Client | 5.14 |
| Base de datos | PostgreSQL | 16 |
| Auth | JWT (HS256) + bcryptjs | 9.0 / 2.4 |
| OAuth | Passport.js + Google Strategy | 0.7 / 2.0 |
| Validación | Zod | 3.23 |
| Email | Nodemailer (Gmail) + SendGrid fallback | 6.9 / 8.1 |
| Seguridad | Helmet + express-rate-limit | — |

#### Motor IA — Ollama

| Modelo | Uso | Parámetros |
|--------|-----|-----------|
| `llama3.1:8b` | Chat, pitch, borrador de vacantes, mejora de perfil | 8B |
| `qwen2.5:3b` | Matching, recomendaciones, fallback de bajo consumo | 3B |
| `phi3:mini` | Moderación de contenido del feed | 3.8B |

---

## 📁 Estructura del Monorepo

```
joblify/
├── backend/                           # API REST Node.js + Express
│   ├── src/
│   │   ├── index.ts                   # Entry point Express
│   │   ├── config/passport.ts         # Google OAuth strategy
│   │   ├── middleware/
│   │   │   └── auth.middleware.ts     # JWT verify + requireRole
│   │   ├── routes/                    # 14 módulos REST
│   │   │   ├── ai.routes.ts           # Motor IA — 7 endpoints
│   │   │   ├── auth.routes.ts         # Auth completo
│   │   │   ├── application.routes.ts  # Pipeline Kanban
│   │   │   ├── job.routes.ts          # Vacantes + filtros
│   │   │   ├── startup.routes.ts      # Startups + roles
│   │   │   ├── message.routes.ts      # Chat REST
│   │   │   ├── user.routes.ts         # Perfiles + CRUD
│   │   │   └── freelance.routes.ts    # Módulo freelance
│   │   └── services/
│   │       ├── ai.service.ts          # Extracción CV
│   │       └── email.service.ts       # Gmail + SendGrid
│   ├── prisma/
│   │   ├── schema.prisma              # 24 modelos · 8 enums
│   │   ├── migrations/                # Migraciones aplicadas
│   │   ├── seed.ts                    # Datos base
│   │   └── seed-demo.ts              # Datos de demostración
│   └── package.json
│
└── talent-flow/                       # Frontend React + Vite
    ├── src/
    │   ├── App.tsx                    # Router — 50+ rutas
    │   ├── components/ (67 archivos)
    │   │   ├── ui/ (49 shadcn/ui)
    │   │   ├── AppAssistantWidget.tsx # Chat IA flotante
    │   │   ├── CVUploader.tsx         # Upload + extracción IA
    │   │   ├── AIMatchBadge.tsx       # Badge de score
    │   │   └── SocialFeed.tsx         # Feed completo
    │   ├── pages/ (68 archivos)
    │   │   ├── Landing.tsx            # Landing pública
    │   │   ├── app/empresa/           # 5 pantallas empresa
    │   │   ├── app/talento/           # 5 pantallas candidato
    │   │   ├── app/freelancer/        # 3 pantallas freelancer
    │   │   ├── app/startup/           # 5 pantallas emprendedor
    │   │   └── app/estudiante/        # 5 pantallas estudiante
    │   ├── lib/api.ts                 # Cliente API — 12 módulos
    │   └── store/authStore.ts         # Zustand persist
    ├── tests/e2e/                     # 43 escenarios Playwright
    └── docs/                          # Documentación por fase y rol
```

---

## 🚀 Instalación

### Prerrequisitos

- [Node.js 20 LTS](https://nodejs.org)
- [PostgreSQL 16](https://www.postgresql.org/download) — local o en [Supabase](https://supabase.com) / [Neon](https://neon.tech)
- [Ollama](https://ollama.com/download) — para el motor de IA local

### 1. Clonar e instalar modelos de IA

```bash
git clone https://github.com/tu-usuario/joblify.git
cd joblify

# Descargar modelos (puede tardar algunos minutos según conexión)
ollama pull llama3.1:8b
ollama pull qwen2.5:3b
ollama pull phi3:mini

ollama serve   # Inicia el servidor Ollama en localhost:11434
```

> **Importante:** Sin los modelos descargados, el matching, el chat y la moderación no funcionarán.

### 2. Configurar y levantar el Backend

```bash
cd backend
npm install

# Copiar y editar variables de entorno
cp .env.example .env
# → Editar .env con tu DATABASE_URL, JWT_SECRET, etc.

# Sincronizar schema con la base de datos
npx prisma generate
npx prisma db push

# Poblar datos iniciales (y opcionalmente datos de demo)
npm run prisma:seed
npm run prisma:seed-demo   # opcional

npm run dev    # API disponible en http://localhost:4000
```

### 3. Levantar el Frontend

```bash
cd talent-flow
npm install

echo "VITE_API_URL=http://localhost:4000/api" > .env

npm run dev    # App disponible en http://localhost:8080
```

### 4. Verificar instalación

```bash
# Frontend — lint + build + E2E Playwright
cd talent-flow && npm run verify

# Backend — compilación TypeScript
cd backend && npm run verify
```

---

## ⚙️ Variables de Entorno

### Backend — `backend/.env`

```env
# ─── Base de Datos ─────────────────────────────────────────────────
DATABASE_URL="postgresql://user:pass@localhost:5432/joblify?connection_limit=15&pool_timeout=30"
DIRECT_URL="postgresql://user:pass@localhost:5432/joblify"

# ─── Autenticación JWT ─────────────────────────────────────────────
JWT_SECRET="cambia_este_secret_largo_min_32_chars"
JWT_REFRESH_SECRET="otro_secret_diferente_min_32_chars"
JWT_ACCESS_EXPIRY="24h"
JWT_REFRESH_EXPIRY="7d"

# ─── Motor de IA — Ollama ──────────────────────────────────────────
OLLAMA_BASE_URL="http://127.0.0.1:11434"
OLLAMA_MODEL="llama3.1:8b"
OLLAMA_LOW_MEMORY_MODEL="qwen2.5:3b"
OLLAMA_MODEL_CHAT="llama3.1:8b"
OLLAMA_MODEL_PITCH="llama3.1:8b"
OLLAMA_MODEL_MATCH="qwen2.5:3b"
OLLAMA_MODEL_MODERATION="phi3:mini"
OLLAMA_TIMEOUT_MS="15000"

# ─── Email (Gmail primario → SendGrid fallback) ────────────────────
SMTP_USER="tu@gmail.com"
SMTP_PASS="tu_app_password_de_gmail"
SENDGRID_API_KEY="SG.xxxxxx"

# ─── OAuth Google ──────────────────────────────────────────────────
GOOGLE_CLIENT_ID="xxxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxx"

# ─── Servidor ──────────────────────────────────────────────────────
PORT=4000
NODE_ENV="development"
FRONTEND_URL="http://localhost:8080"
```

### Frontend — `talent-flow/.env`

```env
VITE_API_URL="http://localhost:4000/api"
```

---

## 🤖 Motor de IA

Joblify implementa un pipeline de IA completamente local mediante **Ollama** — sin enviar datos a APIs externas. Cada endpoint tiene su modelo y timeout configurados de forma independiente.

### Endpoints del motor IA

```
POST /api/ai/match            → qwen2.5:3b    Score 0-100 + explicación + brechas
POST /api/ai/chat             → llama3.1:8b   Chat contextual (carrera / reclutamiento / entrevista)
POST /api/ai/pitch            → llama3.1:8b   Tagline + pitch + CTA de startup
POST /api/ai/job-draft        → llama3.1:8b   Borrador completo de vacante desde un brief
POST /api/ai/improve-profile  → llama3.1:8b   3–5 sugerencias accionables de perfil
POST /api/ai/moderate-content → phi3:mini     Clasificación: safe / warning / blocked
GET  /api/ai/recommendations  → qwen2.5:3b    Top 5 oportunidades personalizadas
```

### Flujo de matching semántico

```
PDF del candidato
       │
       ▼
  Extracción de texto
  (sanitización → Markdown limpio)
       │
       ▼
  Prompt Engineering
  ┌───────────────────────────────────┐
  │  Habilidades del candidato:  ...  │
  │  Requisitos de la vacante:   ...  │
  │  Responde SOLO en JSON:           │
  │  { score: number, reasons: [] }   │
  └───────────────────────────────────┘
       │
       ▼
  Ollama (qwen2.5:3b)
       │
       ▼
  { "score": 78, "reasons": ["Domina React 18", ...] }
       │
       ▼
  PostgreSQL → Applications.matchScore + aiExplanation
```

### Thresholds de compatibilidad

| Score | Indicador | Etiqueta |
|:-----:|:---------:|:--------:|
| 80 – 100 | 🟢 Verde | Altamente compatible |
| 60 – 79 | 🟡 Ámbar | Compatible |
| < 60 | 🔴 Rojo | Poco compatible |

### Rendimiento observado (entorno de desarrollo local)

| Métrica | Valor |
|---------|-------|
| Tiempo promedio de inferencia | ~5.8 s |
| Tiempo con `llama3.1:8b` (descartado para matching) | ~25 s |
| Mejora en consistencia tras sanitizar PDF | ~40% (medido en 25 CVs de prueba) |
| Timeout configurado en API | 15 s |
| Fallback automático ante OOM | `qwen2.5:3b` (low-memory) |

> Los tiempos varían según el hardware. En equipos con GPU o RAM ≥ 16 GB la inferencia es significativamente más rápida.

---

## 📡 API — Endpoints principales

```
# Auth
POST   /api/auth/register          Registro multi-rol
POST   /api/auth/login             Login + emisión de JWT
POST   /api/auth/refresh           Rotación de tokens
POST   /api/auth/verify-otp        Verificación de cuenta
GET    /api/auth/google            OAuth 2.0 Google

# Vacantes
GET    /api/jobs                   Listar vacantes (con filtros)
POST   /api/jobs                   Crear vacante  (rol: Empresa)
GET    /api/jobs/:id               Detalle de vacante
POST   /api/jobs/:id/apply         Postularse + upload CV PDF
PATCH  /api/jobs/:id/kanban        Actualizar estado del pipeline

# IA
POST   /api/ai/match               Score de compatibilidad
POST   /api/ai/extract-cv          Extracción de datos desde PDF
POST   /api/ai/chat                Chat asistente (3 modos)
POST   /api/ai/pitch               Pitch de startup
POST   /api/ai/job-draft           Borrador de vacante
POST   /api/ai/improve-profile     Sugerencias de mejora de perfil
POST   /api/ai/moderate-content    Moderación de contenido
GET    /api/ai/recommendations     Recomendaciones personalizadas

# Usuarios
GET    /api/users/profile          Perfil del usuario autenticado
PATCH  /api/users/profile          Actualizar perfil
GET    /api/users/:id              Perfil público

# Startups, Freelance, Mensajería
POST   /api/startups               Crear startup
GET    /api/freelance/projects     Listar proyectos freelance
GET    /api/messages/:roomId       Historial de conversación
```

---

## 🗃 Esquema de Base de Datos

El modelo de datos cuenta con **24 tablas y 8 enums** diseñados para soportar los 5 roles de usuario y todos los flujos de la plataforma.

<details>
<summary><strong>Ver mapa de relaciones (click para expandir)</strong></summary>

```
users ──────────────────────────────────────────────────────────┐
  │                                                             │
  ├── mentor_profiles       (perfil mentor)                     │
  ├── freelancer_profiles   (perfil freelancer)                 │
  ├── follows               (sistema de seguimiento)            │
  ├── notifications         (centro de notificaciones)          │
  ├── educations            (formación académica)               │
  ├── experiences           (experiencia laboral)               │
  │                                                             │
  └── jobs (poster) ───────────────────────────────────┐        │
        │                                              │        │
        ├── job_skills           (skills requeridas)   │        │
        ├── applications ────────────────────────┐     │        │
        │     ├── application_documents           │    │        │
        │     └── pre_interview_answers           │    │        │
        └── mentor_sessions                       │    │        │
                                                  │    │        │
users (applicant) ────────────────────────────────┘    │        │
  │                                                    │        │
  ├── startups ──────────────────────────────────┐     │        │
  │     ├── startup_roles                        │     │        │
  │     └── cofounder_applications               │     │        │
  │                                              │     │        │
  ├── freelance_projects ────────────────────────┤     │        │
  │     ├── proposals                            │     │        │
  │     ├── escrow                               │     │        │
  │     └── reviews                              │     │        │
  │                                              │     │        │
  ├── posts ─── post_likes / comments            │     │        │
  ├── conversations ── messages                  │     │        │
  │     └── conversation_participants            │     │        │
  ├── saved_jobs / saved_posts                   │     │        │
  └── skill_tests                                │     │        │
```

</details>

### Tablas destacadas

| Tabla | Campos clave | Propósito |
|-------|-------------|-----------|
| `users` | `email`, `role`, `profileData (JSON)`, `profileCompletion` | Entidad central — todos los roles |
| `jobs` | `title`, `salaryMin/Max`, `modality`, `type`, `status` | Vacantes y prácticas |
| `applications` | `status` (6 estados), `matchScore`, `aiExplanation` | Pipeline completo con IA |
| `startups` | `stage`, `sector`, `pitch`, `openRoles` | Módulo emprendedor |
| `freelance_projects` | `budget`, `deadline`, `escrow` | Módulo freelance con pagos |
| `conversations` + `messages` | `isRead`, `requestStatus` | Chat con control de acceso |
| `notifications` | `type`, `payload (JSON)`, `isRead` | Centro de notificaciones |

---

## 🧪 Testing

El proyecto implementa pruebas **End-to-End (E2E)** con [Playwright](https://playwright.dev).

### Ejecutar las pruebas

```bash
cd talent-flow

# Suite completa
npm run test:e2e

# Con reporte visual HTML
npx playwright test --reporter=html
```

```
✓  43 passed  (53.2s)

Cobertura: landing · auth · register · role-select · vacantes ·
           freelancers · empresas · comunidad · forgot-password ·
           reset-password
```

### Escenarios de prueba

| ID | Módulo | Escenario | Estado |
|----|--------|-----------|:------:|
| TEST-01 | Autenticación | Registro con rol Estudiante + emisión de JWT | ✅ |
| TEST-02 | Procesamiento IA | Subida de PDF corrupto → fallback controlado | ✅ |
| TEST-03 | Motor de Matching | Postulación → score semántico en < 10 s | ✅ |
| TEST-04 | Panel Kanban | Drag & drop → persistencia en PostgreSQL | ✅ |
| TEST-05 | Seguridad | Inyección XSS → bloqueo por Helmet + phi3:mini | ✅ |
| TEST-06 | Autenticación | Refresh Token caducado → invalidación y HTTP 401 | ✅ |
| TEST-07 | Motor de Matching | Perfil incompatible → score < 30% con justificación | ✅ |
| TEST-08 | Integridad referencial | Eliminación de cuenta → cascada sin datos huérfanos | ✅ |

---

## 🔍 Calidad de Código — SonarQube

Análisis estático ejecutado con **SonarQube Cloud** sobre el monorepo completo.  
Último análisis: **20/05/2026, 16:09**

### ✅ Quality Gate: PASSED

| Métrica | Valor | Rating |
|---------|-------|:------:|
| Lines of Code | 33 k | — |
| Open Issues | 445 | — |
| Duplicaciones | 3.8% | — |
| Security Rating | C | 🟡 |
| Reliability | B | 🟢 |
| Maintainability | A | 🟢 |
| Security Hotspots Reviewed | 0.0% | 🔴 Pendiente |
| Reducción de issues de seguridad | −23.1% vs. últimos 30 días | 📉 |

### Ejecutar el análisis localmente

```bash
# Backend
cd backend
SONAR_HOST_URL=http://localhost:9000 SONAR_TOKEN=tu_token npm run sonar

# Frontend
cd talent-flow
SONAR_HOST_URL=http://localhost:9000 SONAR_TOKEN=tu_token npm run sonar
```

> Los archivos `sonar-project.properties` están configurados en `backend/` y `talent-flow/`. El análisis en SonarQube Cloud se lanza automáticamente desde el repositorio público de GitHub.

---

## 📊 Estado del Proyecto

| Módulo | Estado | Notas |
|--------|:------:|-------|
| Auth completo (email + OAuth) | ✅ | Verificación OTP, bloqueos, refresh token |
| Perfiles para 5 tipos de usuario | ✅ | CRUD, skills, experiencia, CV |
| Módulo Empresa | ✅ | Vacantes, ranking IA, pipeline Kanban |
| Módulo Candidato | ✅ | Búsqueda, aplicaciones, timeline |
| Motor de Matching IA | ✅ | Score + explicación + brechas |
| Extracción de CV por IA | ✅ | PDF → perfil estructurado |
| Módulo Startups / Emprendedor | ✅ | CRUD, roles, cofundadores, pitch IA |
| Módulo Freelancer | ✅ | Servicios, propuestas, ganancias |
| Módulo Estudiante | ✅ | Prácticas, recursos, aplicaciones |
| Feed social | ✅ | Posts, likes, comentarios, guardados |
| Sistema de mensajería | ✅ | Chat REST con restricción de follow |
| Notificaciones | ✅ | Feed + badge de no leídas |
| Chat WebSocket real | ⚠️ | Actualmente REST polling |
| Pagos Stripe | ⚠️ | Modelo escrow en BD, sin integración real |
| Deploy AWS / CI-CD | ❌ | Próximo sprint |
| Admin dashboard | ❌ | Próximo sprint |

**Cobertura funcional efectiva: ~88%**

---

## 🗺 Roadmap

```
v1.0 — MVP  ✅ Actual
  Matching IA · Auth completo · 5 roles · Pipeline Kanban · Feed · Chat REST

v1.1 — Pagos y Tiempo Real
  └── Stripe Connect · WebSocket (Socket.io) · Redis cache · Colas Bull

v1.2 — Producción
  └── Deploy AWS EC2 + Nginx · GitHub Actions CI/CD · Sentry + Datadog · k6

v2.0 — Scale
  └── Admin dashboard · Mentoría completa · App móvil · Analytics avanzados
```

---

## 📚 Documentación

| Documento | Descripción |
|-----------|-------------|
| [`AGENTS.md`](./talent-flow/AGENTS.md) | Especificaciones técnicas completas del sistema |
| [`docs/entrega-final.md`](./talent-flow/docs/entrega-final.md) | Fase 1 — Requerimientos, actores, casos de uso |
| [`docs/entrega-final-fase2.md`](./talent-flow/docs/entrega-final-fase2.md) | Fase 2 — Arquitectura, stack, modelo de datos, API |
| [`docs/entrega-final-fase3.md`](./talent-flow/docs/entrega-final-fase3.md) | Fase 3 — Implementación, pantallas, QA, trazabilidad |
| [`docs/roles/`](./talent-flow/docs/roles/) | Documentación detallada por cada rol de usuario |
| [`backend/README.md`](./backend/README.md) | Setup y endpoints del backend |

---

## 👥 Equipo

Presentado por:  **Karla Amaranto** **e Isabel Álvarez** 

> Proyecto académico — Tecnología en Desarrollo de Sistemas de Información y Software  
> Corporación Universitaria Rafael Núñez · Cartagena de Indias, Colombia · 2026

**Convenciones de commits:** `feat:` · `fix:` · `docs:` · `refactor:` · `test:`

---

<div align="center">

Con mejorIA para la vida 💙

**[↑ Volver arriba](#)**

</div>
