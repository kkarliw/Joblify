---
role: freelancer
status: completado
updated_at: 2026-05-18
owner: equipo-producto
---

# Rol Freelancer — Implementación (v1)

Documento de avance del rol freelancer. Base: se reutilizó lo estable del rol candidato (perfil dinámico, skills, experiencia) y se extendió con piezas propias de negocio freelancer: servicios, portafolio y reseñas.

## 1) Objetivo funcional

Permitir que el freelancer gestione y muestre su propuesta de valor real:
- servicios profesionales,
- portafolio de trabajos realizados,
- calificaciones/reseñas de clientes.

## 2) Alcance implementado en esta iteración

### Backend
Archivo: `backend/src/routes/freelance.routes.ts`

Se agregaron endpoints para perfil freelancer y gestión de servicios:

- `GET /api/freelance/my/services`
  - Lista servicios del freelancer autenticado.

- `PUT /api/freelance/services/:id`
  - Edita servicio propio.

- `DELETE /api/freelance/services/:id`
  - Elimina servicio propio.

- `GET /api/freelance/:id/reviews`
  - Lista reseñas públicas de un freelancer.

- `GET /api/freelance/me/profile`
  - Devuelve vista consolidada para panel propio:
    - `services`
    - `portfolioItems` (derivado de `service.portfolio`)
    - `reviews`
    - `stats` (`reviewsCount`, `avgRating`)

Además, `POST /api/freelance/services` ahora acepta:
- `portfolio: string[]` (opcional)

### Frontend

#### API client
Archivo: `talent-flow/src/lib/api.ts`

Se agregó `freelanceApi` con:
- `getMyProfile`
- `getMyServices`
- `createService`
- `updateService`
- `deleteService`
- `getFreelancerReviews`

#### Perfil compartido
Archivo: `talent-flow/src/pages/app/shared/ProfilePage.tsx`

Se conectó data real para freelancer:
- Reseñas reales (se reemplazó bloque mock).
- Portafolio real (links agregados en servicios).

Se agregó gestión visual de servicios (en modo edición):
- Crear servicio
- Editar servicio
- Eliminar servicio
- Gestión de links de portafolio por servicio
- Estado vacío cuando no hay reseñas/portafolio.

## 3) Estado actual

### Ya funcional
- Lectura de reseñas reales de clientes en el perfil freelancer.
- Visualización de portafolio real desde datos backend.
- Endpoints CRUD base para servicios listos en backend.

### Pendiente para completar rol freelancer al 100%
- Mejorar presentación de portafolio con cards/media preview (hoy link-based).
- Conectar flujo de creación de reseñas al cerrar proyectos (si aplica lógica de negocio actual).

## 4) Riesgos / notas

- Se corrigió colisión de rutas en Express cambiando reseñas públicas a `/reviews/:id`.
- Si no se reinicia backend después de cambios de rutas, frontend puede ver 404 temporales.

## 5) Checklist del rol freelancer

- [x] Endpoints base de perfil freelancer
- [x] Endpoints base de reseñas freelancer
- [x] Endpoints base CRUD de servicios
- [x] Reemplazo de reseñas mock en perfil
- [x] Portafolio real en perfil
- [x] Gestión visual completa de servicios en frontend
- [x] Dashboard freelancer 100% dinámico
- [x] Cierre de métricas operativas freelancer
