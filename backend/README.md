# Joblify Backend API

Node.js 20 + Express + Prisma + PostgreSQL (Supabase)

---

## 🚀 Configuración inicial (hazlo una sola vez)

### 1. Instalar Node.js
Si no lo tienes, descárgalo de https://nodejs.org (versión LTS)
Reinicia Windsurf/terminal después de instalar.

### 2. Instalar dependencias
```bash
cd backend
npm install
```

### 3. Configurar Supabase
1. Ve a https://supabase.com y crea una cuenta gratuita
2. Crea un nuevo proyecto (guarda la contraseña)
3. Ve a: **Settings → Database → Connection string**
4. Copia las URLs de **Transaction pooler** y **Direct connection**

### 4. Crear el archivo .env
```bash
copy .env.example .env
```
Abre `.env` y pega tus URLs de Supabase:
```
DATABASE_URL="postgresql://postgres.[REF]:[PASS]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[REF]:[PASS]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
JWT_SECRET="joblify_super_secreto_2026_cambia_esto"
JWT_REFRESH_SECRET="joblify_refresh_secreto_2026_diferente"
```

### 5. Crear las tablas en Supabase
```bash
npm run prisma:push
```

### 6. Sembrar datos demo
```bash
npm run prisma:seed
```

### 7. Iniciar el servidor
```bash
npm run dev
```
El servidor corre en http://localhost:4000

---

## 📡 Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/auth/register | Registro |
| POST | /api/auth/login | Login → JWT |
| GET  | /api/auth/me | Perfil propio |
| GET  | /api/jobs | Listado de vacantes |
| POST | /api/jobs | Publicar vacante (empresa) |
| POST | /api/applications | Aplicar a vacante |
| GET  | /api/feed | Feed social |
| POST | /api/ai/chat | AI Recruiter (Ollama) |
| POST | /api/ai/match | Match score IA |
| GET  | /api/messages/conversations | Mis conversaciones |

---

## 👥 Usuarios demo (después del seed)

| Email | Password | Rol |
|-------|----------|-----|
| candidato@demo.joblify.io | Demo1234! | Candidato |
| empresa@demo.joblify.io | Demo1234! | Empresa |
| freelancer@demo.joblify.io | Demo1234! | Freelancer |
| emprendedor@demo.joblify.io | Demo1234! | Emprendedor |
| estudiante@demo.joblify.io | Demo1234! | Estudiante |

---

## 🗄️ Ver la BD visualmente
```bash
npm run prisma:studio
```
Abre http://localhost:5555 con todas las tablas.

---

## ✅ Verificación antes de subir a GitHub

```bash
npm run verify
```

Ejecuta compilación TypeScript del backend para validar que no hay errores de build.

---

## 🔎 SonarQube

1. Instalar scanner (si no está disponible globalmente):
```bash
npm i -D sonar-scanner
```

2. Configurar variables de entorno en terminal (cmd):
```bat
set SONAR_HOST_URL=http://localhost:9000
set SONAR_TOKEN=tu_token
```

3. Ejecutar análisis:
```bash
npm run sonar
```

Config usada: `sonar-project.properties`.
