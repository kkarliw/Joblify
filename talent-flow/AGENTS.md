# AGENTS.md — Joblify


## 1. Qué es Joblify

Plataforma web SaaS que unifica en un solo ecosistema digital cinco tipos de usuarios del mercado laboral latinoamericano: **candidatos, freelancers, empresas/reclutadores, emprendedores y estudiantes**. El diferenciador central es un **motor de matching con IA local (Ollama)** que analiza perfiles estructurados en lugar de CVs en PDF estáticos y genera scores de compatibilidad con explicación en lenguaje natural.

**Geografía inicial:** Colombia, México, España — idioma: Español.  
**Modelo de negocio:** Freemium para usuarios individuales · Suscripción mensual para empresas (Starter $49 / Growth $149 / Enterprise $499 USD) · Comisión 8% en pagos freelance · 10% en mentoría.

---

## 2. Stack tecnológico (no negociable)

| Capa | Tech | Versión |
|---|---|---|
| Frontend framework | Next.js App Router | 14.x |
| UI | React + Tailwind CSS | 18.x / 3.x |
| Estado global | Zustand | 4.x |
| Data fetching / cache | TanStack Query | 5.x |
| Backend | Node.js + Express | 20 LTS / 4.x |
| ORM | Prisma | 5.x |
| Base de datos | PostgreSQL | 16.x |
| Cache + colas | Redis | 7.x |
| WebSockets | Socket.io | 4.x |
| Auth | JWT (RS256) + bcrypt + Passport.js | — |
| IA | Ollama (llama3.1 / qwen2.5 fallback) | — |
| Archivos | AWS S3 + CloudFront | — |
| Email | SendGrid | — |
| Pagos | Stripe + Stripe Connect | API 2024 |
| Deploy | AWS EC2 + Nginx + Certbot | — |
| CI/CD | GitHub Actions | — |
| Monitoring | Sentry + Datadog | — |
| Testing | Jest + Supertest + React Testing Library | — |

---

## 3. Estructura del monorepo

```
joblify/
├── frontend/                  # Next.js 14 App Router
│   ├── app/                   # Pages, layouts, routes
│   ├── components/            # Componentes React por dominio
│   └── hooks/                 # Custom hooks
├── backend/
│   └── src/
│       ├── routes/            # Endpoints REST por módulo
│       ├── services/          # Lógica de negocio
│       ├── workers/           # Workers async (matching IA, CV processor)
│       └── integrations/      # Motor IA (Ollama), Stripe, SendGrid, S3
├── backend/prisma/            # Schema + migraciones
├── shared/                    # Tipos TypeScript + constantes compartidas
└── .github/workflows/         # CI/CD pipelines
```

---

## 4. Diseño visual (Design System)

El estilo es **"Apple aplicado a LinkedIn"** — limpio, humano, confiable. **NUNCA** usar estética SaaS genérica ni colores llamativos random.

| Token | Valor |
|---|---|
| Tipografía | Inter (Google Fonts) — 700 títulos / 400 cuerpo / 500 labels |
| h1 / h2 / h3 / body / caption / label | 32 / 24 / 20 / 16 / 14 / 12 px |
| Background principal | `#FFFFFF` |
| Background secundario | `#F5F5F7` |
| Texto principal | `#1D1D1F` |
| Texto secundario | `#6E6E73` |
| Navbar border | `#D2D2D7` |
| Accent (azul Apple) | `#0071E3` |
| Success / match alto (80+) | `#34C759` |
| Warning / match medio (60–79) | `#FF9F0A` |
| Error / match bajo (<60) | `#FF3B30` |
| Border-radius botones | `980px` (píldora completa) |
| Border-radius cards | `12px` |
| Border-radius inputs | `8px` · altura `44px` |
| Border-radius modales | `16px` |
| Sombra cards | `0 2px 8px rgba(0,0,0,0.08)` |
| Sombra modales | `0 20px 60px rgba(0,0,0,0.16)` |
| Espaciado base | `8px` (múltiplos de 8 siempre) |
| Transiciones | `all 0.2s ease` |

**Layout:** Navbar superior fija (logo izquierda · buscador central · iconos derecha). **NUNCA sidebar fija.** Home feed = 3 columnas en desktop (perfil resumido | feed central | recomendaciones), 1 columna en móvil.

---

## 5. Base de datos — Schema Prisma

Implementar en `/backend/prisma/schema.prisma`. Todas las entidades usan UUID como PK.

### Entidades principales

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  role          UserRole
  emailVerified Boolean   @default(false)
  createdAt     DateTime  @default(now())
  profile       Profile?
  company       Company?
  entrepreneur  Entrepreneur?
}

enum UserRole { CANDIDATE FREELANCER COMPANY ENTREPRENEUR STUDENT MENTOR ADMIN }

model Profile {
  id            String      @id @default(uuid())
  userId        String      @unique
  user          User        @relation(fields: [userId], references: [id])
  type          ProfileType
  headline      String?
  summary       String?
  skills        Json        // { name, level: "basic"|"intermediate"|"advanced" }[]
  aiProfile     Json?       // Generado por Ollama tras analizar CV
  completionPct Int         @default(0)
  candidate     Candidate?
  freelancer    Freelancer?
  student       Student?
  mentor        Mentor?
}

enum ProfileType { CANDIDATE FREELANCER STUDENT MENTOR }

model Candidate {
  id              String   @id @default(uuid())
  profileId       String   @unique
  profile         Profile  @relation(fields: [profileId], references: [id])
  experienceYears Int?
  cvUrl           String?
  availability    String?
  expectedSalary  Float?
  modalityPref    String?
}

model Freelancer {
  id           String   @id @default(uuid())
  profileId    String   @unique
  profile      Profile  @relation(fields: [profileId], references: [id])
  services     Json     // { title, category, description, price, deliveryDays, portfolio[] }[]
  hourlyRate   Float?
  rating       Decimal? @default(0)
  verified     Boolean  @default(false)
  portfolioUrls String[]
}

model Student {
  id                 String  @id @default(uuid())
  profileId          String  @unique
  profile            Profile @relation(fields: [profileId], references: [id])
  institution        String?
  career             String?
  semester           Int?
  internshipTypePref String?
  weeklyHours        Int?
}

model Mentor {
  id           String  @id @default(uuid())
  profileId    String  @unique
  profile      Profile @relation(fields: [profileId], references: [id])
  specialties  Json
  sessionTypes Json    // { type: "individual"|"group"|"workshop", price }[]
  ratePerSession Float?
  rating       Decimal? @default(0)
}

model Company {
  id          String      @id @default(uuid())
  userId      String      @unique
  user        User        @relation(fields: [userId], references: [id])
  name        String
  industry    String?
  size        CompanySize?
  logoUrl     String?
  plan        PlanType    @default(STARTER)
  verified    Boolean     @default(false)
  jobPostings JobPosting[]
  internships Internship[]
}

enum CompanySize { STARTUP SMALL MEDIUM LARGE ENTERPRISE }
enum PlanType { STARTER GROWTH ENTERPRISE }

model Entrepreneur {
  id            String   @id @default(uuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id])
  bio           String?
  industries    Json?
  projectsCount Int      @default(0)
  projects      Project[]
}

model JobPosting {
  id           String     @id @default(uuid())
  companyId    String
  company      Company    @relation(fields: [companyId], references: [id])
  title        String
  description  String
  requirements Json
  salaryMin    Float?
  salaryMax    Float?
  modality     String
  status       JobStatus  @default(DRAFT)
  expiresAt    DateTime?
  applications Application[]
  matches      Match[]
}

enum JobStatus { DRAFT ACTIVE PAUSED CLOSED }

model Project {
  id                String            @id @default(uuid())
  entrepreneurId    String
  entrepreneur      Entrepreneur      @relation(fields: [entrepreneurId], references: [id])
  name              String
  description       String
  stage             ProjectStage
  industry          String?
  rolesNeeded       Json              // { title, skills[], availability }[]
  collaborationType CollaborationType
  status            String            @default("active")
}

enum ProjectStage { IDEA MVP GROWTH SCALE }
enum CollaborationType { VOLUNTARY PAID EQUITY }

model Internship {
  id           String  @id @default(uuid())
  companyId    String
  company      Company @relation(fields: [companyId], references: [id])
  area         String
  modality     String
  durationMonths Int?
  compensation Float?
  academicReq  Json?
  spots        Int     @default(1)
  status       String  @default("active")
}

model Application {
  id              String     @id @default(uuid())
  applicantId     String
  opportunityType String     // "job"|"project"|"internship"|"academic"
  opportunityId   String
  jobPosting      JobPosting? @relation(fields: [opportunityId], references: [id], map: "fk_application_job")
  status          AppStatus  @default(APPLIED)
  aiScore         Decimal?
  aiExplanation   String?
  appliedAt       DateTime   @default(now())
}

enum AppStatus { APPLIED REVIEWING PRE_INTERVIEW INTERVIEW OFFER HIRED REJECTED }

model Match {
  id              String   @id @default(uuid())
  profileId       String
  profileType     String
  opportunityId   String
  opportunityType String
  score           Decimal
  explanation     String
  jobPosting      JobPosting? @relation(fields: [opportunityId], references: [id], map: "fk_match_job")
  createdAt       DateTime @default(now())
}

model Message {
  id          String   @id @default(uuid())
  senderId    String
  receiverId  String
  content     String
  attachments Json?
  read        Boolean  @default(false)
  createdAt   DateTime @default(now())
}

model Payment {
  id          String      @id @default(uuid())
  payerId     String
  payeeId     String
  contextType String
  contextId   String
  amount      Decimal
  commission  Decimal
  status      PayStatus   @default(PENDING)
  stripeId    String?
  createdAt   DateTime    @default(now())
}

enum PayStatus { PENDING IN_ESCROW RELEASED REFUNDED FAILED }

model Notification {
  id        String   @id @default(uuid())
  userId    String
  type      String
  payload   Json
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
}

model Review {
  id          String   @id @default(uuid())
  reviewerId  String
  reviewedId  String
  contextType String
  contextId   String
  rating      Int      // 1–5
  comment     String?
  createdAt   DateTime @default(now())
}

model Post {
  id        String   @id @default(uuid())
  authorId  String
  content   String
  mediaUrls String[]
  likesCount Int     @default(0)
  createdAt DateTime @default(now())
}

model SkillTest {
  id           String   @id @default(uuid())
  userId       String
  skill        String
  score        Int
  passed       Boolean
  takenAt      DateTime @default(now())
  nextAllowedAt DateTime?
}
```

---

## 6. API REST — Endpoints por módulo

Base URL: `/api/v1`. Todos los endpoints autenticados requieren header `Authorization: Bearer <JWT>`.

### Auth
```
POST   /api/v1/auth/register          → Registro con rol
POST   /api/v1/auth/login             → JWT + refresh token
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh
POST   /api/v1/auth/verify-email
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
GET    /api/v1/auth/google            → OAuth Google (Passport.js)
```

### Perfil
```
GET    /api/v1/profile/me             → Mi perfil completo
PUT    /api/v1/profile/me             → Actualizar perfil
POST   /api/v1/profile/upload-cv      → Upload CV PDF → S3 → trigger extracción IA
GET    /api/v1/profile/:id            → Perfil público
```

### Vacantes (empresa)
```
GET    /api/v1/jobs                   → Listar vacantes (feed candidato)
POST   /api/v1/jobs                   → Crear vacante [empresa]
GET    /api/v1/jobs/:id
PUT    /api/v1/jobs/:id               → Editar [empresa]
PATCH  /api/v1/jobs/:id/status        → Activar/pausar/cerrar [empresa]
DELETE /api/v1/jobs/:id               → Eliminar [empresa]
GET    /api/v1/jobs/:id/ranking       → Ranking IA de candidatos [empresa]
POST   /api/v1/jobs/:id/apply        → Aplicar a vacante [candidato]
```

### Pipeline
```
GET    /api/v1/pipeline/:jobId        → Kanban de candidatos [empresa]
PATCH  /api/v1/pipeline/:applicationId/status → Mover etapa
POST   /api/v1/pipeline/:applicationId/note   → Agregar nota privada
```

### Matching IA
```
POST   /api/v1/matching/trigger/:jobId       → Disparar matching manual
GET    /api/v1/matching/recommendations      → Feed personalizado del usuario
```

### Freelance
```
GET    /api/v1/services               → Listar servicios
POST   /api/v1/services               → Publicar servicio [freelancer]
PUT    /api/v1/services/:id
PATCH  /api/v1/services/:id/toggle    → Activar/pausar
POST   /api/v1/proposals              → Enviar propuesta a freelancer
PATCH  /api/v1/proposals/:id          → Aceptar/rechazar/contraoferta
```

### Proyectos (emprendedor)
```
GET    /api/v1/projects
POST   /api/v1/projects               → Publicar proyecto [emprendedor]
GET    /api/v1/projects/:id
PUT    /api/v1/projects/:id
POST   /api/v1/projects/:id/apply     → Aplicar a rol en proyecto
```

### Prácticas
```
GET    /api/v1/internships            → Feed para estudiantes
POST   /api/v1/internships            → Publicar práctica [empresa]
POST   /api/v1/internships/:id/apply
```

### Mentoría
```
GET    /api/v1/mentors                → Listar mentores
POST   /api/v1/mentors/sessions       → Agendar sesión
GET    /api/v1/mentors/sessions/me    → Mis sesiones
POST   /api/v1/reviews                → Dejar evaluación
```

### Chat (WebSocket + REST)
```
GET    /api/v1/messages/conversations → Lista de conversaciones
GET    /api/v1/messages/:userId       → Historial con usuario
WS     /socket.io                     → Tiempo real
```

### Pagos
```
POST   /api/v1/payments/checkout      → Crear checkout Stripe
POST   /api/v1/payments/release/:id  → Liberar escrow
GET    /api/v1/payments/balance       → Balance freelancer
POST   /api/v1/payments/withdraw      → Solicitar retiro
POST   /api/v1/payments/webhook       → Webhook Stripe (público)
```

### Notificaciones
```
GET    /api/v1/notifications          → Listar
PATCH  /api/v1/notifications/read-all → Marcar todas leídas
```

### Admin
```
GET    /api/v1/admin/metrics          → KPIs globales
GET    /api/v1/admin/users            → Gestión de usuarios
PATCH  /api/v1/admin/users/:id/status → Suspender/reactivar
GET    /api/v1/admin/logs             → Auditoría
```

---

## 7. Motor de Matching IA — Lógica de implementación

### Worker principal: `/backend/src/workers/matchingWorker.js`

El matching se ejecuta de forma **asíncrona** vía cola Redis (bull/ioredis). Se dispara automáticamente al:
- Activar una vacante/proyecto
- Actualizar un perfil (completion > 60%)
- Nueva aplicación manual

### Prompt al modelo de Ollama

```javascript
// En /backend/src/integrations/ollama.ts
const analyzeMatch = async (candidateProfile, opportunity) => {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
  const model = process.env.OLLAMA_MODEL || 'llama3.1:8b';

  const prompt = `Analiza la compatibilidad entre este candidato y esta oportunidad.

CANDIDATO:
${JSON.stringify(candidateProfile)}

OPORTUNIDAD:
${JSON.stringify(opportunity)}

Responde SOLO en JSON con este formato exacto:
{
  "score": <número 0-100>,
  "explanation": "<explicación en 2-3 oraciones en español para el reclutador>",
  "topReasons": ["<razón 1>", "<razón 2>", "<razón 3>"],
  "matchedSkills": ["<skill1>", "<skill2>"],
  "gaps": ["<gap1>"]
}`;

  const response = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: false, format: 'json', options: { temperature: 0.2, num_predict: 900 } }),
  });

  const data = await response.json();
  return JSON.parse(data.response);
};
```

### Worker de extracción de CV

```javascript
// Cuando candidato sube CV PDF:
// 1. Upload a S3 con URL prefirmada
// 2. Extraer texto del PDF
// 3. Enviar a Ollama para estructurar
const extractCVData = async (pdfText) => {
  // Prompt → Ollama extrae skills, experiencia, educación
  // Retorna objeto estructurado para pre-llenar el perfil
  // El usuario revisa y confirma antes de guardar
};
```

### Score thresholds

| Score | Color badge | Acción sugerida |
|---|---|---|
| 80–100 | `#34C759` verde | "Altamente compatible" |
| 60–79 | `#FF9F0A` ámbar | "Compatible" |
| < 60 | `#FF3B30` rojo | No aparece en ranking top por defecto |

---

## 8. Autenticación y Seguridad

```javascript
// JWT RS256 — generar claves:
// openssl genrsa -out private.pem 2048
// openssl rsa -in private.pem -pubout -out public.pem

// Middleware de auth
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  const decoded = jwt.verify(token, process.env.JWT_PUBLIC_KEY, { algorithms: ['RS256'] });
  req.user = decoded;
  next();
};

// Middleware de rol
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  next();
};
```

**Reglas de seguridad:**
- TLS 1.3 obligatorio en producción
- bcrypt salt factor: 12
- JWT expira en 24h · Refresh token 7 días (solo si "recordarme")
- Rate limiting: 5 intentos fallidos → bloqueo 15 min
- Protección CSRF, XSS, SQL injection vía Prisma (prepared statements)
- Admin requiere 2FA obligatorio

---

## 9. Redis — Estrategia de caché

```javascript
// Claves de caché
const CACHE_KEYS = {
  jobRanking: (jobId) => `ranking:job:${jobId}`,         // TTL 30min
  companyProfile: (id) => `profile:company:${id}`,       // TTL 1h
  userFeed: (userId) => `feed:${userId}`,                // TTL 15min
  skillsCatalog: () => 'catalog:skills',                  // TTL 24h
  unreadCount: (userId) => `notif:unread:${userId}`,     // Tiempo real
};

// Colas de tareas (Bull)
const matchingQueue = new Bull('matching', redisConfig);
const cvProcessingQueue = new Bull('cv-processing', redisConfig);
const emailQueue = new Bull('email', redisConfig);
```

---

## 10. WebSocket — Chat en tiempo real

```javascript
// /backend/src/socket.js
io.on('connection', (socket) => {
  const userId = socket.handshake.auth.userId;
  
  socket.join(`user:${userId}`); // Room personal
  
  socket.on('send_message', async (data) => {
    // Guardar en DB → emitir al receptor
    const msg = await saveMessage(data);
    io.to(`user:${data.receiverId}`).emit('new_message', msg);
  });
  
  socket.on('mark_read', async (conversationId) => {
    await markMessagesRead(userId, conversationId);
    socket.to(`user:${conversationId}`).emit('messages_read', { by: userId });
  });
});
```

---

## 11. Pantallas prioritarias (implementar en este orden)

> El frontend ya existe parcialmente. Completar en este orden por prioridad de entrega.

### Prioridad 1 — Core flows
1. **Landing page** — Hero + cómo funciona + CTA por tipo de usuario
2. **Auth flow** — Register (selector visual de 5 roles) + Login + OAuth Google
3. **Onboarding** — Wizard 3 pasos por tipo de perfil
4. **Home Feed** — Layout 3 columnas, cards con score badge, filtros
5. **Mi perfil** — Edición completa, upload CV, % completado, preview pública

### Prioridad 2 — Módulo empresa (genera el dinero)
6. **Publicar vacante** — Form en pasos + sugerencias IA en tiempo real
7. **Ranking candidatos IA** — Lista con score, explicación, acciones
8. **Pipeline Kanban** — Drag & drop, notas, estados

### Prioridad 3 — Módulo candidato
9. **Mis aplicaciones** — Pipeline visual, estado, historial
10. **Búsqueda global** — Filtros avanzados

### Prioridad 4 — Módulos adicionales
11. **Freelance** — Servicios, propuestas, ganancias/escrow
12. **Proyectos** — Publicar, aplicar, gestionar roles
13. **Prácticas** — Feed estudiante, aplicar
14. **Mentoría** — Búsqueda, agenda, sesiones
15. **Chat** — Layout WhatsApp Web
16. **Notificaciones** — Feed, badge contador
17. **Admin dashboard** — KPIs, gestión usuarios

---

## 12. Variables de entorno

```env
# /backend/.env
DATABASE_URL=postgresql://user:pass@localhost:5432/joblify
REDIS_URL=redis://localhost:6379

JWT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n..."
JWT_REFRESH_SECRET=random_secret_here

OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.1:8b
OLLAMA_LOW_MEMORY_MODEL=qwen2.5:0.5b

AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=joblify-uploads
CLOUDFRONT_URL=https://cdn.joblify.com

STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=hola@joblify.com

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

FRONTEND_URL=https://joblify.com
NODE_ENV=production
PORT=3001

# /frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## 13. Requisitos no funcionales clave

| Métrica | Target |
|---|---|
| API response time | P95 < 300ms (hasta 500 usuarios concurrentes) |
| Análisis IA (matching) | < 4 segundos por par |
| Carga inicial frontend | < 2 segundos |
| Procesamiento CV | < 10 segundos (PDF hasta 5MB) |
| Entrega mensajes chat | < 500ms E2E |
| Usuarios concurrentes | Mínimo 5,000 sin degradación |
| Uptime | 99.5% mensual |
| Cobertura de tests | 75% mínimo en lógica de negocio |

---

## 14. Reglas de negocio importantes

- Perfil con **< 60% completado** NO aparece en recomendaciones a empresas
- Al activar una vacante, el matching se ejecuta automáticamente en **< 5 minutos**
- El candidato tiene **48h** para responder a una propuesta antes de que expire
- Chatbot de preentrevista: **NO puede preguntar** sobre religión, etnia, estado civil, orientación sexual, condición migratoria
- Pagos retornan a escrow; se liberan **solo cuando ambas partes confirman** entrega
- Admin requiere **2FA obligatorio**
- CVs aceptados solo en **PDF** (máx. 5MB)
- Dos cuentas con el **mismo email son imposibles** (unique constraint)
- Bloqueo de cuenta: **5 intentos fallidos → 15 minutos**

---

## 15. Checklist de entrega para el 29 de mayo

- [ ] Schema Prisma completo + migraciones corriendo
- [ ] Auth flow completo (register/login/OAuth/verify email)
- [ ] Perfiles para los 5 tipos de usuario
- [ ] Home Feed con recomendaciones IA
- [ ] Módulo empresa: publicar vacante + ranking IA + pipeline kanban
- [ ] Módulo candidato: aplicar + mis aplicaciones
- [ ] Motor de matching funcionando (Ollama)
- [ ] Extracción de CV (Ollama)
- [ ] Chat en tiempo real (Socket.io)
- [ ] Notificaciones en tiempo real
- [ ] Pagos básicos (Stripe — suscripción empresa)
- [ ] Deploy en AWS EC2 con Nginx
- [ ] Variables de entorno configuradas
- [ ] README con instrucciones de instalación

---