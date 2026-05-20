<div align="center">

<br />

```
     ██╗ ██████╗ ██████╗ ██╗     ██╗███████╗██╗   ██╗
     ██║██╔═══██╗██╔══██╗██║     ██║██╔════╝╚██╗ ██╔╝
     ██║██║   ██║██████╔╝██║     ██║█████╗   ╚████╔╝ 
██   ██║██║   ██║██╔══██╗██║     ██║██╔══╝    ╚██╔╝  
╚█████╔╝╚██████╔╝██████╔╝███████╗██║██║        ██║   
 ╚════╝  ╚═════╝ ╚═════╝ ╚══════╝╚═╝╚═╝        ╚═╝   
```

**Plataforma de Empleo Inteligente para Latinoamérica**

_Connecting talent, companies, freelancers, entrepreneurs and students — powered by local AI_

<br />

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-20_LTS-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Prisma](https://img.shields.io/badge/Prisma-5.14-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io)

[![Tests](https://img.shields.io/badge/E2E_Tests-43_Passed-22C55E?style=for-the-badge&logo=playwright&logoColor=white)](./talent-flow/tests/e2e)
[![Status](https://img.shields.io/badge/Status-MVP_Funcional-FFCC00?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/License-Clow-6B7280?style=for-the-badge)](#)

<br />

[🚀 Demo](#demo) · [📚 Documentación](#documentación) · [⚡ Instalación rápida](#instalación-rápida) · [🤖 Motor IA](#motor-de-ia)

<br />

</div>

---

## ¿Qué es Joblify?

Joblify unifica en un solo ecosistema digital **cinco tipos de usuarios** del mercado laboral latinoamericano. A diferencia de las plataformas tradicionales que dependen de CVs en PDF estáticos, Joblify utiliza un **motor de matching con IA local (Ollama)** que analiza perfiles estructurados y genera scores de compatibilidad con explicación en lenguaje natural.

| 👤 Candidato | 🏢 Empresa | 💼 Freelancer | 🚀 Emprendedor | 🎓 Estudiante |
|:---:|:---:|:---:|:---:|:---:|
| Encuentra empleo compatible con su perfil mediante IA | Publica vacantes y obtiene ranking automático de candidatos | Gestiona servicios, propuestas y pagos con escrow | Lanza startups y busca cofundadores con pitch IA | Accede a prácticas profesionales y recursos educativos |

> **Geografía inicial:** Colombia — **Idioma:** Español

---

## ✨ Funcionalidades Destacadas

<table>
<tr>
<td width="50%">

### 🤖 Motor de IA Local
- **Matching inteligente** — Score 0-100 con explicación natural
- **Extracción de CV** — PDF → perfil estructurado automáticamente
- **Chat contextual** — Asistente IA flotante en toda la app
- **Pitch de startup** — Generación automática de tagline + pitch + CTA
- **Borrador de vacantes** — Empresas crean vacantes desde un brief
- **Mejora de perfil** — Sugerencias accionables personalizadas
- **Moderación de contenido** — Filtrado automático del feed social

</td>
<td width="50%">

### 📊 Módulo Empresa
- **Pipeline Kanban** drag & drop con 6 estados
- **Ranking IA** de candidatos con badges de color
- **Agendamiento de entrevistas** con email automático
- **Publicación de vacantes** en pasos con IA
- **Dashboard** con métricas en tiempo real

</td>
</tr>
<tr>
<td>

### 👤 Módulo Candidato / Talento
- **Filtros avanzados** — ubicación, modalidad, salario, skills, fecha
- **Timeline de aplicaciones** — seguimiento visual de cada proceso
- **Upload de CV** con extracción y pre-llenado de perfil por IA
- **Feed personalizado** con recomendaciones basadas en perfil
- **Guardado** de vacantes y posts favoritos

</td>
<td>

### 🚀 Módulo Emprendedor
- **CRUD completo** de startups con roles y equity
- **Pitch obligatorio por IA** — sin fallbacks, sin texto genérico
- **Gestión de cofundadores** — postulaciones con estados
- **Búsqueda de talento** filtrada por rol y afinidad
- **Overview de métricas** de la startup

</td>
</tr>
</table>

---

## 🏗 Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│               CLIENTE (Browser / Mobile)                │
│   React 18 + Vite + TailwindCSS + Zustand + shadcn/ui  │
│              TanStack Query (cache + fetch)              │
└──────────────────────┬──────────────────────────────────┘
                       │  REST API · HTTPS
                       ▼
┌─────────────────────────────────────────────────────────┐
│               BACKEND (Node.js 20 LTS)                  │
│         Express 4 · TypeScript · Prisma ORM             │
│  ┌──────────┐ ┌──────────────┐ ┌───────┐ ┌──────────┐  │
│  │ Auth JWT │ │  14 Módulos  │ │ Ollama│ │  Email   │  │
│  │  OAuth   │ │  REST API    │ │  IA   │ │  Service │  │
│  └──────────┘ └──────────────┘ └───────┘ └──────────┘  │
└──────────┬──────────────────────────────────────────────┘
           │
    ┌──────┴──────────────┐
    ▼                     ▼
┌──────────┐        ┌──────────────────────────────────┐
│PostgreSQL│        │          Ollama Local             │
│ Prisma 5 │        │  llama3.1:8b · qwen2.5:3b ·      │
│  Pool 15 │        │           phi3:mini               │
└──────────┘        └──────────────────────────────────┘
```

**Patrón:** Monorepo · `backend/` + `fronted/` · API REST · No microservicios

---

## 🛠 Stack Tecnológico

### Frontend (`talent-flow/`)

| Categoría | Tecnología | Versión |
|-----------|-----------|---------|
| Framework | React + Vite | 18.3 / 5.4 |
| Lenguaje | TypeScript | 5.8 |
| Estilos | Tailwind CSS | 3.4 |
| Componentes | shadcn/ui (Radix UI) — 49 componentes | Última |
| Estado global | Zustand (persist) | 4.5 |
| Data fetching | TanStack React Query | 5.83 |
| Routing | React Router DOM | 6.30 |
| Formularios | React Hook Form + Zod | 7.61 / 3.25 |
| Animaciones | Framer Motion | 12.38 |
| Testing E2E | Playwright | Última |

### Backend (`backend/`)

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
| Email | Nodemailer (Gmail) + SendGrid | 6.9 / 8.1 |
| Seguridad | Helmet + express-rate-limit | — |

### Motor IA — Ollama

| Modelo | Uso | Params |
|--------|-----|--------|
| `llama3.1:8b` | Chat, pitch, job draft, mejora de perfil | 8B |
| `qwen2.5:3b` | Matching, recomendaciones, fallback | 3B |
| `phi3:mini` | Moderación de contenido | 3.8B |

---

## 📁 Estructura del Monorepo

```
joblify/
├── backend/                          # API REST Node.js + Express
│   ├── src/
│   │   ├── index.ts                  # Entry point Express
│   │   ├── config/passport.ts        # Google OAuth strategy
│   │   ├── middleware/
│   │   │   └── auth.middleware.ts    # JWT verify + requireRole
│   │   ├── routes/                   # 14 módulos REST
│   │   │   ├── ai.routes.ts          # Motor IA — 7 endpoints (58KB)
│   │   │   ├── auth.routes.ts        # Auth completo (640 líneas)
│   │   │   ├── application.routes.ts # Pipeline Kanban (21KB)
│   │   │   ├── job.routes.ts         # Vacantes + filtros (11KB)
│   │   │   ├── startup.routes.ts     # Startups + roles (14KB)
│   │   │   ├── message.routes.ts     # Chat REST (13KB)
│   │   │   ├── user.routes.ts        # Perfiles + CRUD (20KB)
│   │   │   └── freelance.routes.ts   # Freelance (9KB)
│   │   └── services/
│   │       ├── ai.service.ts         # Extracción CV (129 líneas)
│   │       └── email.service.ts      # Gmail + SendGrid (455 líneas)
│   ├── prisma/
│   │   ├── schema.prisma             # 24 modelos · 8 enums (681 líneas)
│   │   ├── migrations/               # 2 migraciones aplicadas
│   │   ├── seed.ts                   # Datos base
│   │   └── seed-demo.ts             # Datos de demostración
│   └── package.json
│
└── talent-flow/                      # Frontend React + Vite
    ├── src/
    │   ├── App.tsx                   # Router — 50+ rutas
    │   ├── components/ (67 items)
    │   │   ├── ui/ (49 shadcn)
    │   │   ├── AppAssistantWidget.tsx # Chat IA flotante (21KB)
    │   │   ├── CVUploader.tsx        # Upload + extracción IA
    │   │   ├── AIMatchBadge.tsx      # Badge de score
    │   │   └── SocialFeed.tsx        # Feed completo (20KB)
    │   ├── pages/ (68 items)
    │   │   ├── Landing.tsx           # Landing pública (41KB)
    │   │   ├── app/empresa/          # 5 pantallas empresa
    │   │   ├── app/talento/          # 5 pantallas candidato
    │   │   ├── app/freelancer/       # 3 pantallas freelancer
    │   │   ├── app/startup/          # 5 pantallas emprendedor
    │   │   └── app/estudiante/       # 5 pantallas estudiante
    │   ├── lib/api.ts                # Cliente API — 12 módulos
    │   └── store/authStore.ts        # Zustand persist
    ├── tests/e2e/                    # 43 escenarios Playwright
    └── docs/                         # Documentación por fase y rol
```

---

## ⚡ Instalación Rápida

### Prerrequisitos

- **Node.js** 20 LTS ([nodejs.org](https://nodejs.org))
- **PostgreSQL** 16 local o cuenta en [Supabase](https://supabase.com) / [Neon](https://neon.tech)
- **Ollama** ([ollama.com](https://ollama.com))

### 1. Clonar e instalar modelos IA

```bash
git clone https://github.com/tu-usuario/joblify.git
cd joblify

# Descargar modelos de IA (puede tardar algunos minutos)
ollama pull llama3.1:8b
ollama pull qwen2.5:3b
ollama pull phi3:mini
ollama serve  # Inicia el servidor en localhost:11434
```

### 2. Configurar y levantar el Backend

```bash
cd backend
npm install

# Copiar y editar variables de entorno
cp .env.example .env
# Editar .env con tu DATABASE_URL, JWT_SECRET, etc.

# Sincronizar schema y poblar datos iniciales
npx prisma generate
npx prisma db push
npm run prisma:seed     # Datos base
npm run prisma:seed-demo  # Datos de demo (opcional)

npm run dev             # http://localhost:4000
```

### 3. Levantar el Frontend

```bash
cd talent-flow
npm install

# Configurar variable de entorno
echo "VITE_API_URL=http://localhost:4000/api" > .env

npm run dev             # http://localhost:8080
```

### 4. Verificar instalación

```bash
# Frontend — lint + build + E2E Playwright
cd talent-flow && npm run verify

# Backend — compilación TypeScript
cd backend && npm run verify
```

---

## 🤖 Motor de IA

El matching utiliza **Ollama en local** — sin enviar datos a APIs externas. Cada endpoint tiene su modelo y timeout configurados:

```
POST /api/ai/match          → qwen2.5:3b   → Score 0-100 + explicación + brechas
POST /api/ai/chat           → llama3.1:8b  → Chat contextual (carrera/reclutamiento)
POST /api/ai/pitch          → llama3.1:8b  → Tagline + pitch + CTA de startup
POST /api/ai/job-draft      → llama3.1:8b  → Borrador completo de vacante
POST /api/ai/improve-profile → llama3.1:8b → 3-5 sugerencias accionables
POST /api/ai/moderate-content → phi3:mini  → Clasificación: safe/warning/blocked
GET  /api/ai/recommendations → qwen2.5:3b  → Top 5 oportunidades personalizadas
```

### Thresholds de compatibilidad

| Score | Color | Etiqueta |
|:-----:|:-----:|:--------:|
| 80 – 100 | 🟢 Verde | Altamente compatible |
| 60 – 79 | 🟡 Ámbar | Compatible |
| < 60 | 🔴 Rojo | Poco compatible |

> El sistema hace fallback automático al modelo `low-memory` si hay error de OOM.

---

## 🧪 Testing

```bash
# Suite E2E completa (Playwright)
cd talent-flow
npm run test:e2e
```

```
 ✓  43 passed  (53.2s)
 
 Cobertura: landing, auth, register, role-select,
            vacantes, freelancers, empresas, comunidad,
            forgot-password, reset-password
```

---

## 📋 Variables de Entorno

### Backend (`.env`)

```env
# Base de datos
DATABASE_URL="postgresql://user:pass@localhost:5432/joblify?connection_limit=15&pool_timeout=30"
DIRECT_URL="postgresql://user:pass@localhost:5432/joblify"

# Auth
JWT_SECRET="cambia_este_secret_largo_min_32_chars"
JWT_REFRESH_SECRET="otro_secret_diferente"

# IA — Ollama local
OLLAMA_BASE_URL="http://127.0.0.1:11434"
OLLAMA_MODEL="llama3.1:8b"
OLLAMA_LOW_MEMORY_MODEL="qwen2.5:3b"
OLLAMA_MODEL_CHAT="llama3.1:8b"
OLLAMA_MODEL_PITCH="llama3.1:8b"
OLLAMA_MODEL_MATCH="qwen2.5:3b"
OLLAMA_MODEL_MODERATION="phi3:mini"

# Email (Gmail primario → SendGrid fallback)
SMTP_USER="tu@gmail.com"
SMTP_PASS="tu_app_password"
SENDGRID_API_KEY="SG.xxxxxx"

# Google OAuth
GOOGLE_CLIENT_ID="xxxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxx"

# Servidor
FRONTEND_URL="http://localhost:8080"
PORT=4000
```

### Frontend (`.env`)

```env
VITE_API_URL="http://localhost:4000/api"
```

---

## 📊 Estado del Proyecto

### Módulos implementados

| Módulo | Estado | Notas |
|--------|--------|-------|
| Auth completo (email + OAuth) | ✅ Completo | Verificación, bloqueos, refresh token |
| Perfiles para 5 tipos de usuario | ✅ Completo | CRUD, skills, experiencia, CV |
| Módulo Empresa | ✅ Completo | Vacantes, ranking IA, pipeline Kanban |
| Módulo Candidato | ✅ Completo | Búsqueda, aplicaciones, timeline |
| Motor de Matching IA | ✅ Completo | Score + explicación + brechas |
| Extracción de CV por IA | ✅ Completo | PDF → perfil estructurado |
| Módulo Startups/Emprendedor | ✅ Completo | CRUD, roles, cofundadores, pitch IA |
| Módulo Freelancer | ✅ Completo | Servicios, propuestas, ganancias |
| Módulo Estudiante | ✅ Completo | Prácticas, recursos, aplicaciones |
| Feed social | ✅ Completo | Posts, likes, comentarios, guardados |
| Sistema de mensajería | ✅ Completo | Chat REST con restricción de follow |
| Notificaciones | ✅ Completo | Feed + badge de no leídas |
| Chat WebSocket real | ⚠️ Parcial | Actualmente REST polling |
| Pagos Stripe | ⚠️ Parcial | Modelo escrow en BD, sin integración real |
| Deploy AWS / CI-CD | ❌ Pendiente | Para siguiente sprint |
| Admin dashboard | ❌ Pendiente | Para siguiente sprint |

**Cobertura funcional efectiva: ~88%**

---

## 📚 Documentación

| Documento | Descripción |
|-----------|-------------|
| [`AGENTS.md`](./talent-flow/AGENTS.md) | Especificaciones técnicas completas del sistema |
| [`docs/entrega-final.md`](./talent-flow/docs/entrega-final.md) | Fase 1: Requerimientos, actores, casos de uso |
| [`docs/entrega-final-fase2.md`](./talent-flow/docs/entrega-final-fase2.md) | Fase 2: Arquitectura, stack, modelo de datos, API |
| [`docs/entrega-final-fase3.md`](./talent-flow/docs/entrega-final-fase3.md) | Fase 3: Implementación, pantallas, QA, trazabilidad |
| [`docs/roles/`](./talent-flow/docs/roles/) | Documentación detallada por cada rol de usuario |
| [`backend/README.md`](./backend/README.md) | Setup y endpoints del backend |

---

## 🗺 Roadmap

```
v1.0 — MVP (✅ Actual)
  Matching IA · Auth completo · 5 roles · Pipeline · Feed · Chat REST

v1.1 — Pagos y Tiempo Real (Próximo)
  └── Stripe Connect · WebSocket Socket.io · Redis cache · Colas Bull

v1.2 — Producción
  └── Deploy AWS EC2 + Nginx · GitHub Actions CI/CD · Sentry + Datadog

v2.0 — Scale
  └── Admin dashboard · Mentoría completa · App móvil · Analytics avanzados
```

---

## 🤝 Contribuir

```bash
# Crear rama desde develop
git checkout -b feature/nombre-del-feature

# Ejecutar verificación antes de hacer push
cd talent-flow && npm run verify
cd backend && npm run verify

# Pull request a develop
```

**Convenciones de commits:** `feat:`, `fix:`, `docs:`, `refactor:`, `test:`

---

## ⚖️ Licencia

Clow — © 2026 Joblify. Todos los derechos reservados.

---

<div align="center">

Presentado por: Karla Amaranto, Isabel Alvarez

**[↑ Volver arriba](#)**

</div>
