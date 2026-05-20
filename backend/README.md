# Joblify Backend API

Backend de Joblify con Node.js + Express + Prisma + PostgreSQL.

## Stack

- Node.js 20+
- Express 4
- Prisma ORM
- PostgreSQL local

---

## Configuración local

### 1) Instalar dependencias

```bash
cd backend
npm install
```

### 2) Configurar variables de entorno (`.env`)

Crear `backend/.env` con valores locales (ejemplo):

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/joblify"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/joblify"
JWT_SECRET="cambia_este_secret"
JWT_REFRESH_SECRET="cambia_este_refresh_secret"
PORT=4000
FRONTEND_URL="http://localhost:8080"

OLLAMA_BASE_URL="http://127.0.0.1:11434"
OLLAMA_MODEL="llama3.1:8b"
OLLAMA_LOW_MEMORY_MODEL="qwen2.5:3b"
OLLAMA_MODEL_CHAT="llama3.1:8b"
OLLAMA_MODEL_PITCH="llama3.1:8b"
OLLAMA_MODEL_MATCH="qwen2.5:3b"
OLLAMA_MODEL_MODERATION="phi3:mini"
```

### 3) Sincronizar esquema de BD

```bash
npm run prisma:push
```

### 4) Seed de datos

```bash
npm run prisma:seed
```

### 5) Levantar API

```bash
npm run dev
```

API disponible en `http://localhost:4000`.

---

## Scripts útiles

- `npm run dev` → desarrollo
- `npm run build` → compilar TypeScript
- `npm run verify` → verificación rápida (build)
- `npm run prisma:push` → sincronizar esquema
- `npm run prisma:seed` → sembrar datos
- `npm run prisma:studio` → abrir Prisma Studio

---

## Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registro |
| POST | `/api/auth/login` | Login |
| GET  | `/api/auth/me` | Perfil autenticado |
| GET  | `/api/jobs` | Listado de vacantes |
| POST | `/api/jobs` | Publicar vacante |
| POST | `/api/applications` | Aplicar a vacante |
| GET  | `/api/feed` | Feed social |
| POST | `/api/ai/chat` | Chat IA |
| POST | `/api/ai/match` | Matching IA |

---

## SonarQube

1) Instalar scanner si no está disponible:

```bash
npm i -D sonar-scanner
```

2) Configurar variables en terminal:

```bat
set SONAR_HOST_URL=http://localhost:9000
set SONAR_TOKEN=tu_token
```

3) Ejecutar:

```bash
npm run sonar
```

Configuración: `backend/sonar-project.properties`.
