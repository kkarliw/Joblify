# Joblify Monorepo

Plataforma Joblify con frontend y backend en un solo repositorio.

## Estructura

- `talent-flow/` → Frontend (React + Vite + Tailwind)
- `backend/` → API (Node.js + Express + Prisma + PostgreSQL)

## Requisitos

- Node.js 20+
- npm 10+
- PostgreSQL local
- Ollama local (para módulos IA)

## Arranque rápido

### 1) Backend

```bash
cd backend
npm install
npm run prisma:push
npm run prisma:seed
npm run dev
```

API por defecto: `http://localhost:4000`

### 2) Frontend

```bash
cd talent-flow
npm install
npm run dev
```

App por defecto: `http://localhost:8080`

## Verificación

### Frontend

```bash
cd talent-flow
npm run verify
```

Incluye lint + build + E2E Playwright.

### Backend

```bash
cd backend
npm run verify
```

Compila TypeScript y valida build.

## Pruebas E2E (Playwright)

```bash
cd talent-flow
npm run test:e2e
```

Suite actual: `tests/e2e/marketing-and-auth.spec.ts` (43 escenarios).

## SonarQube

Cada proyecto tiene su propio archivo de configuración:

- `backend/sonar-project.properties`
- `talent-flow/sonar-project.properties`

Ejecutar por proyecto:

```bash
npm run sonar
```

## Documentación

- `talent-flow/docs/entrega-final.md`
- `talent-flow/docs/entrega-final-fase2.md`
- `talent-flow/docs/entrega-final-fase3.md`
- `talent-flow/docs/roles/`
