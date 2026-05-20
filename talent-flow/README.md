# Joblify Frontend (`talent-flow`)

Frontend de Joblify construido con React + Vite + Tailwind + TanStack Query.

## Requisitos

- Node.js 20+
- npm 10+

## Instalación

```bash
npm install
```

## Desarrollo local

```bash
npm run dev
```

## Verificación antes de subir a GitHub

```bash
npm run verify
```

Este comando ejecuta:
- `npm run lint`
- `npm run build`
- `npm run test:e2e`

## Pruebas E2E (Playwright)

```bash
npm run test:e2e
```

Suite actual: `tests/e2e/marketing-and-auth.spec.ts`.

## SonarQube

1. Instalar scanner (si no está instalado globalmente):
```bash
npm i -D sonar-scanner
```

2. Definir variables de entorno en terminal (ejemplo cmd):
```bat
set SONAR_HOST_URL=http://localhost:9000
set SONAR_TOKEN=tu_token
```

3. Ejecutar análisis:
```bash
npm run sonar
```

Config usada: `sonar-project.properties`.

## Estructura clave

- `src/` → código de aplicación
- `tests/e2e/` → pruebas Playwright
- `playwright.config.ts` → configuración E2E
- `sonar-project.properties` → configuración SonarQube
