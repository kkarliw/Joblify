---
role: empresa
status: completado
updated_at: 2026-05-18
owner: equipo-producto
---

# Rol Empresa — Documentación v1

## Fase 1 · Levantamiento de requerimientos
- Eliminar experiencias rotas que enviaban a rutas públicas y duplicaban información.
- Unificar la narrativa de marca "Apple aplicado a LinkedIn" en cada visita a la empresa.
- Mostrar datos reales (vacantes activas, procesos en curso, contrataciones, cultura) alimentados desde BD.
- Permitir que las empresas editen cultura, beneficios y datos de contratación sin depender del equipo técnico.
- Preparar el espacio para sumar próximos módulos (beneficios IA, vitrinas de talento, stories de cultura).

## Fase 2 · Diseño de experiencia
- Hero modular con cover, logo, estado verificado y CTA primario (Aplicar / Contactar) replicando el layout del mock.
- Fichas métricas (Vacantes activas, En proceso, Contrataciones) con formato compacto (`k+`, `M+`).
- Tabs scroll-sync (Overview, Vacantes, Tecnologías, Cultura) con indicadores sticky.
- Bloques de contenido jerárquicos: narrativa, enlaces públicos, beneficios, cultura, stack tecnológico real.
- Cards de vacantes con jerarquía premium: match, salario, metadatos, skills y CTA.

## Fase 3 · Desarrollo
### Backend
- `GET /api/companies/:id` ahora expone `companyProfile` normalizado (industria, tamaño, year founded, specialties, cultureValues, benefits, hiringEmail).
- Inclusión de métricas en el payload (`stats.activeJobs`, `stats.inProcess`, `stats.hires`).
- `jobs` embebidos incluyen category, skills, apply/view counts, benefits, salary y metadata para tabs.
- Refuerzo de filtros `isActive` y `role` para evitar fugas de datos.

### Frontend
- `talent-flow/src/pages/EmpresaDetalle.tsx` reescrito:
  - Hero + métricas + tabs sincronizados con IntersectionObserver.
  - Blocs Overview/Vacantes/Tecnologías/Cultura conectados al payload real.
  - CTA y enlaces (sitio, LinkedIn, hiring email) verificados.
  - Cards de vacantes con salary band, skills reales y navegación role-aware `/app/<rol>/vacantes/:id`.
- `talent-flow/src/pages/app/shared/ProfilePage.tsx`
  - Campos editables para empresas: industry, companySize, foundedYear, teamSize, specialties, cultureValues, benefits, hiringEmail.
  - Persistencia vía `userApi.updateMe` (profileData JSON).

### Integraciones / IA
- Los bloques de Cultura y Beneficios ya reciben arrays ordenados para consumo de futuros resúmenes IA (Ollama). Falta habilitar endpoint de generación automática.

## QA y checklist
- [x] Navegación interna respeta `/app/<rol>/empresas/:id`.
- [x] Tabs funcionales con scroll + focus.
- [x] Métricas comparan datos reales vs placeholders.
- [x] Campos editables persisten y se reflejan en el detalle público.
- [x] Preparado para sumar IA (placeholder de insights).

## Pendientes
1. Automatizar copy de Cultura/Beneficios con IA (Ollama) opcional.
2. Añadir bloque "Historias" cuando backend exponga testimonios.
3. Emprendedor comparte parte de este layout; quedará pendiente hasta que salga de mock.
