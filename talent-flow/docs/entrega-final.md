# Joblify — Documentación Completa de Entrega

**Versión:** 1.0  
**Fecha:** 20 de mayo de 2026  
**Estado:** MVP funcional completo

---

# 1. Descripción General del Producto

**Joblify** es una plataforma web SaaS que unifica en un solo ecosistema digital cinco tipos de usuarios del mercado laboral latinoamericano: **candidatos, freelancers, empresas/reclutadores, emprendedores y estudiantes**.

El diferenciador central es un **motor de matching con IA local (Ollama)** que analiza perfiles estructurados en lugar de CVs estáticos en PDF, y genera scores de compatibilidad con explicación en lenguaje natural.

- **Geografía inicial:** Colombia, México, España
- **Idioma:** Español
- **Modelo de negocio:** Freemium individuos · Suscripción empresa ($49/$149/$499 USD) · Comisión 8% freelance · 10% mentoría

---

# 2. FASE 1 — Levantamiento de Requerimientos

## 2.1 Objetivos del Sistema

| # | Objetivo | Prioridad |
|---|----------|-----------|
| OBJ-01 | Candidatos encuentran empleo compatible con su perfil mediante IA | Alta |
| OBJ-02 | Empresas publican vacantes y obtienen ranking automático de candidatos | Alta |
| OBJ-03 | Freelancers se conectan con proyectos y gestionan pagos seguros (escrow) | Alta |
| OBJ-04 | Emprendedores publican startups y buscan cofundadores | Alta |
| OBJ-05 | Estudiantes acceden a catálogo de prácticas profesionales | Media |
| OBJ-06 | Chat en tiempo real entre usuarios conectados | Media |
| OBJ-07 | Feed social profesional con publicaciones y comentarios | Media |
| OBJ-08 | Recomendaciones personalizadas de oportunidades mediante IA | Alta |
| OBJ-09 | Extracción de datos de CVs en PDF automáticamente con IA | Media |
| OBJ-10 | Seguridad con verificación de email, JWT y rate limiting | Alta |

## 2.2 Actores del Sistema

| Actor | Descripción | Acciones principales |
|-------|-------------|---------------------|
| **Candidato** | Profesional buscando empleo | Buscar vacantes, aplicar, gestionar aplicaciones, subir CV, ver recomendaciones IA |
| **Empresa** | Reclutador o compañía | Publicar vacantes, ver ranking IA, gestionar pipeline Kanban, agendar entrevistas |
| **Freelancer** | Trabajador independiente | Publicar servicios, recibir propuestas, gestionar proyectos, cobrar por escrow |
| **Emprendedor** | Fundador de startup | Publicar startup, buscar cofundadores, gestionar roles y postulaciones |
| **Estudiante** | Universitario en formación | Buscar prácticas, aplicar, acceder a recursos educativos |

## 2.3 Requerimientos Funcionales

### RF-AUTH: Autenticación y Registro

| ID | Requerimiento | Estado |
|----|--------------|--------|
| RF-AUTH-01 | Registro con selección de rol (5 roles) | ✅ |
| RF-AUTH-02 | Verificación de email con código 6 dígitos (TTL 15 min) | ✅ |
| RF-AUTH-03 | Login email+contraseña, bloqueo de no verificados | ✅ |
| RF-AUTH-04 | Login con Google OAuth 2.0 | ✅ |
| RF-AUTH-05 | Recuperación de contraseña por email | ✅ |
| RF-AUTH-06 | Tokens JWT (access 24h + refresh 7d) | ✅ |
| RF-AUTH-07 | Reenvío de código con cooldown (60s) y max intentos (5) | ✅ |
| RF-AUTH-08 | Limpieza de cuentas no verificadas (TTL 72h) | ✅ |
| RF-AUTH-09 | Onboarding post-registro adaptado por rol | ✅ |

### RF-PROFILE: Perfil de Usuario

| ID | Requerimiento | Estado |
|----|--------------|--------|
| RF-PROF-01 | Edición completa (nombre, bio, headline, ubicación, URLs) | ✅ |
| RF-PROF-02 | CRUD de experiencia laboral | ✅ |
| RF-PROF-03 | CRUD de educación | ✅ |
| RF-PROF-04 | CRUD de habilidades (skills) con nivel 1-5 | ✅ |
| RF-PROF-05 | Upload de CV PDF con extracción IA | ✅ |
| RF-PROF-06 | Porcentaje de completitud calculado | ✅ |
| RF-PROF-07 | Perfil público visible por otros usuarios | ✅ |
| RF-PROF-08 | Foto de perfil y cover | ✅ |
| RF-PROF-09 | Sistema de seguimiento (follow/unfollow) | ✅ |

### RF-JOBS: Módulo de Vacantes

| ID | Requerimiento | Estado |
|----|--------------|--------|
| RF-JOBS-01 | Listado con filtros avanzados (búsqueda, ubicación, modalidad, tipo, salario, skills, fecha) | ✅ |
| RF-JOBS-02 | Ordenamiento por relevancia, fecha, salario, vistas | ✅ |
| RF-JOBS-03 | Detalle completo de vacante | ✅ |
| RF-JOBS-04 | Publicación de vacante por empresa | ✅ |
| RF-JOBS-05 | Aplicación con CV, carta de presentación y recomendación | ✅ |
| RF-JOBS-06 | Guardar/desguardar vacantes favoritas | ✅ |
| RF-JOBS-07 | Mis vacantes publicadas (empresa) | ✅ |
| RF-JOBS-08 | Ranking IA de candidatos por vacante | ✅ |
| RF-JOBS-09 | Pipeline Kanban drag & drop (6 estados) | ✅ |
| RF-JOBS-10 | Agendamiento de entrevistas con email | ✅ |

### RF-FREELANCE: Módulo Freelance

| ID | Requerimiento | Estado |
|----|--------------|--------|
| RF-FREE-01 | CRUD de servicios freelance | ✅ |
| RF-FREE-02 | Listado de proyectos disponibles | ✅ |
| RF-FREE-03 | Envío de propuestas | ✅ |
| RF-FREE-04 | Mis propuestas enviadas | ✅ |
| RF-FREE-05 | Sistema de reseñas (1-5 + comentario) | ✅ |
| RF-FREE-06 | Escrow para pagos seguros | ✅ (modelo) |
| RF-FREE-07 | Ganancias del freelancer | ✅ |

### RF-STARTUP: Módulo Emprendedor

| ID | Requerimiento | Estado |
|----|--------------|--------|
| RF-START-01 | CRUD de startups | ✅ |
| RF-START-02 | Gestión de roles abiertos (equity) | ✅ |
| RF-START-03 | Aplicación como cofundador | ✅ |
| RF-START-04 | Panel de postulantes con gestión de estado | ✅ |
| RF-START-05 | Búsqueda de cofundadores | ✅ |
| RF-START-06 | Pitch de startup por IA (sin fallback local) | ✅ |
| RF-START-07 | Overview de métricas | ✅ |

### RF-STUDENT: Módulo Estudiante

| ID | Requerimiento | Estado |
|----|--------------|--------|
| RF-STUD-01 | Catálogo de prácticas con filtros | ✅ |
| RF-STUD-02 | Aplicación a prácticas | ✅ |
| RF-STUD-03 | Catálogo de recursos educativos | ✅ |
| RF-STUD-04 | Dashboard de estudiante | ✅ |

### RF-AI: Motor de Inteligencia Artificial

| ID | Requerimiento | Estado |
|----|--------------|--------|
| RF-AI-01 | Chat IA contextual (carrera, reclutamiento, pre-entrevista) | ✅ |
| RF-AI-02 | Extracción automática de CV (PDF → perfil) | ✅ |
| RF-AI-03 | Matching candidato-vacante (score 0-100 + explicación) | ✅ |
| RF-AI-04 | Borrador de vacante por IA | ✅ |
| RF-AI-05 | Sugerencias de mejora de perfil | ✅ |
| RF-AI-06 | Moderación automática de contenido | ✅ |
| RF-AI-07 | Recomendaciones personalizadas | ✅ |
| RF-AI-08 | Pitch de startup por IA | ✅ |
| RF-AI-09 | Normalización lingüística de salidas IA | ✅ |
| RF-AI-10 | Routing de modelos por endpoint | ✅ |

### RF-SOCIAL: Feed y Comunicación

| ID | Requerimiento | Estado |
|----|--------------|--------|
| RF-SOC-01 | Feed con likes, comentarios, tags | ✅ |
| RF-SOC-02 | Publicación de contenido (texto + imagen) | ✅ |
| RF-SOC-03 | Feed público y autenticado | ✅ |
| RF-SOC-04 | Guardar publicaciones | ✅ |
| RF-SOC-05 | Mensajería directa con conversaciones | ✅ |
| RF-SOC-06 | Restricción: solo contactos con follow pueden chatear | ✅ |
| RF-SOC-07 | Notificaciones con badge no leídas | ✅ |

## 2.4 Requerimientos No Funcionales

| ID | Requerimiento | Métrica |
|----|--------------|---------|
| RNF-01 | Tiempo de respuesta API | P95 < 300ms |
| RNF-02 | Análisis IA (matching) | < 4s por par |
| RNF-03 | Carga inicial frontend | < 2s |
| RNF-04 | Procesamiento de CV | < 10s (PDF ≤ 5MB) |
| RNF-05 | Rate limiting | 300 req / 15 min por IP |
| RNF-06 | Seguridad contraseñas | bcrypt salt rounds: 12 |
| RNF-07 | Protección de rutas | JWT + middleware auth + role |

## 2.5 Reglas de Negocio

| # | Regla |
|---|-------|
| RN-01 | Email único por usuario (unique constraint) |
| RN-02 | Login bloqueado si email no verificado (403) |
| RN-03 | Cuentas no verificadas se eliminan tras 72h |
| RN-04 | 5 intentos fallidos de verificación = bloqueo 15 min |
| RN-05 | Candidato solo aplica 1 vez a misma vacante (unique) |
| RN-06 | Solo contactos con follow pueden iniciar chat |
| RN-07 | Pitch de startup es solo IA; si falla, error (no fallback) |
| RN-08 | Moderación IA filtra contenido antes de publicar |
| RN-09 | Solo rol EMPRESA puede publicar vacantes |
| RN-10 | Solo rol EMPRENDEDOR puede crear startups |
| RN-11 | Usuarios demo (@demo.joblify.io) excluidos de búsquedas |
| RN-12 | CVs solo PDF (máx 5MB) |

## 2.6 Casos de Uso Principales

### CU-01: Registro y Verificación

**Actor:** Usuario nuevo  
**Flujo:**
1. Accede a `/register`, selecciona rol
2. Completa formulario (nombre, email, contraseña, campos por rol)
3. Backend crea usuario `emailVerified: false`, genera código 6 dígitos
4. Email con código (Gmail → SendGrid fallback)
5. Ingresa código → backend valida → genera JWT
6. Redirige a onboarding por rol

### CU-02: Candidato Aplica a Vacante

**Actor:** Candidato autenticado  
**Flujo:**
1. Navega a vacantes, usa filtros avanzados
2. Selecciona vacante → ve detalle
3. "Aplicar" → sube CV + carta → Application creada (APLICADO)
4. Ve progreso en timeline de aplicaciones

### CU-03: Empresa Gestiona Pipeline

**Actor:** Empresa autenticada  
**Flujo:**
1. Va a pipeline → ve Kanban por estados
2. Drag & drop candidato → cambia estado
3. Si ENTREVISTA → modal agendamiento (remoto/presencial)
4. Backend persiste + envía email al candidato

### CU-04: Matching IA

**Actor:** Empresa  
**Flujo:**
1. Solicita matching para vacante
2. Backend envía perfiles + vacante a Ollama
3. Genera score 0-100, explicación, skills coincidentes, brechas
4. Ranking con badges de color (verde ≥80, ámbar 60-79, rojo <60)

### CU-05: Emprendedor Publica Startup

**Actor:** Emprendedor  
**Flujo:**
1. Va a publicar → completa formulario
2. Genera pitch por IA (obligatorio IA, sin fallback)
3. Crea startup con roles abiertos
4. Otros usuarios postulan como cofundadores
5. Gestiona postulaciones (aceptar/rechazar)

---

> **Continúa en:**
> - [`entrega-final-fase2.md`](./entrega-final-fase2.md) — FASE 2: Diseño (arquitectura, stack, modelo de datos, API, UI)
> - [`entrega-final-fase3.md`](./entrega-final-fase3.md) — FASE 3: Desarrollo (implementación, módulos, pantallas, QA, matriz de trazabilidad)
