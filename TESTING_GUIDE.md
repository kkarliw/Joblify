# Guía de Prueba - Sistema de Auth Corregido

## Requisitos Previos
- Backend corriendo: `npx tsx src/index.ts` en `/backend`
- Frontend corriendo: `npm run dev` en `/talent-flow`
- Base de datos PostgreSQL activa
- Gmail SMTP configurado en `.env`

---

## 1. PRUEBA DE REGISTRO

### Paso 1: Acceder a Registro
```
URL: http://localhost:8080/register/elegir
```

### Paso 2: Seleccionar Rol y Completar Datos
**Ejemplo - Candidato:**
- Email: `candidato@test.com`
- Contraseña: `Test123456`
- Nombre: `Juan Pérez`
- Rol: `Candidato`
- Área: `Desarrollo`
- Ubicación: `Bogotá`
- Años de experiencia: `3`
- Disponibilidad: `Tiempo completo`
- Salario esperado: `50000`
- Modalidad: `Remoto`

### Paso 3: Verificar Respuesta del Backend
**Esperado:**
```json
{
  "user": {
    "id": "uuid...",
    "email": "candidato@test.com",
    "name": "Juan Pérez",
    "role": "candidato"
  },
  "message": "Registro exitoso. Revisa tu email para el codigo de verificacion."
}
```

**IMPORTANTE:** NO debe incluir `accessToken` ni `refreshToken`

### Paso 4: Verificar Email
- Revisa bandeja de entrada de `joblify.noreply@gmail.com`
- Deberías recibir email con código de 6 dígitos
- Copia el código

### Paso 5: Ingresar Código de Verificación
- Frontend muestra pantalla: "Verifica tu email"
- Ingresa el código de 6 dígitos
- Click en "Verificar y continuar"

**Esperado:**
```json
{
  "message": "Email verificado correctamente",
  "user": { ... },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

**Resultado:** Frontend redirige a `/onboarding` y guarda tokens en localStorage

---

## 2. PRUEBA DE LOGIN - USUARIO VERIFICADO

### Paso 1: Ir a Login
```
URL: http://localhost:8080/login
```

### Paso 2: Ingresar Credenciales
- Email: `candidato@test.com`
- Contraseña: `Test123456`

**Esperado:**
```json
{
  "user": { ... },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

**Resultado:** Acceso permitido, redirige a home

---

## 3. PRUEBA DE LOGIN - USUARIO NO VERIFICADO

### Paso 1: Crear Usuario Sin Verificar (Simulado)
En base de datos, actualiza un usuario:
```sql
UPDATE "users" SET "emailVerified" = false WHERE email = 'candidato@test.com';
```

### Paso 2: Intentar Login
- Email: `candidato@test.com`
- Contraseña: `Test123456`

**Esperado:**
```json
{
  "error": "Debes verificar tu email antes de iniciar sesion. Revisa tu bandeja de entrada.",
  "needsVerification": true,
  "email": "candidato@test.com"
}
```

**Resultado:** Frontend redirige automáticamente a `/register/verify?email=candidato@test.com`

---

## 4. PRUEBA DE REENVIAR CÓDIGO

### Paso 1: Estar en Pantalla de Verificación
```
URL: http://localhost:8080/register/verify?email=candidato@test.com
```

### Paso 2: Click en "Reenviar código"
- Espera 60 segundos (o el timer se reinicia)
- Click en "Reenviar código"

**Esperado:**
- Nuevo email con nuevo código de 6 dígitos
- Mensaje: "Codigo de verificacion reenviado. Revisa tu email."

### Paso 3: Ingresar Nuevo Código
- Copia el nuevo código del email
- Ingresa en el formulario
- Click en "Verificar y continuar"

**Resultado:** Email verificado, acceso permitido

---

## 5. PRUEBA DE FORGOT PASSWORD

### Paso 1: Ir a Forgot Password
```
URL: http://localhost:8080/forgot-password
```

### Paso 2: Ingresar Email
- Email: `candidato@test.com`

**Esperado:**
```json
{
  "message": "Si el email existe, recibiras instrucciones"
}
```

### Paso 3: Verificar Email
- Revisa bandeja de entrada
- Deberías recibir email con link de reset
- Link debe ser: `http://localhost:8080/reset-password?token=...`

### Paso 4: Hacer Click en Link
- Abre el link del email
- Ingresa nueva contraseña: `NewPass123456`
- Click en "Restablecer contraseña"

**Resultado:** Contraseña actualizada, puedes login con nueva contraseña

---

## 6. VERIFICAR DATOS EN BASE DE DATOS

### Usuario Registrado Correctamente
```sql
SELECT id, email, name, role, "emailVerified", "isVerified", "profileData" 
FROM "users" 
WHERE email = 'candidato@test.com';
```

**Esperado:**
```
id              | uuid
email           | candidato@test.com
name            | Juan Pérez
role            | CANDIDATO
emailVerified   | true (después de verificar)
isVerified      | true (después de verificar)
profileData     | {"experienceYears": 3, "availability": "fulltime", ...}
```

---

## 7. VERIFICAR LOGS DEL BACKEND

### Logs Esperados en Consola

**Registro:**
```
[DEBUG] Register - Role received: candidato
[Email] Codigo de verificacion enviado a candidato@test.com: 123456
```

**Verificación:**
```
[Verify Email Error] (si hay error)
Email verificado correctamente
```

**Login Bloqueado:**
```
[Login Error] (si hay error)
```

---

## 8. CHECKLIST DE VALIDACIÓN

- [ ] Registro crea usuario sin tokens
- [ ] Email de verificación se envía con código de 6 dígitos
- [ ] Código se valida correctamente contra BD
- [ ] Después de verificar, se generan tokens
- [ ] Login bloquea usuarios no verificados
- [ ] Frontend redirige automáticamente a verificación
- [ ] Reenviar código genera nuevo código y envía email
- [ ] Forgot password envía email con link
- [ ] Reset password actualiza contraseña en BD
- [ ] profileData se guarda correctamente en JSON
- [ ] Tokens se guardan en localStorage
- [ ] Logout elimina tokens de localStorage y BD

---

## 9. PRUEBA DE DIFERENTES ROLES

Repite el flujo de registro con cada rol:

### Empresa
- Nombre de empresa: `Tech Corp`
- Industria: `Tecnología`
- Tamaño: `Mediana`

### Freelancer
- Tarifa por hora: `75`
- Disponibilidad: `Por proyectos`

### Emprendedor
- Bio: `Fundador de startups`
- Industria: `Fintech`
- Nombre del proyecto: `Mi App`

### Estudiante
- Institución: `Universidad Nacional`
- Carrera: `Ingeniería de Software`
- Semestre: `5`
- Tipo de práctica: `Práctica profesional`
- Horas semanales: `20`

---

## 10. TROUBLESHOOTING

### Email no se envía
1. Verificar `.env` tiene `GMAIL_USER` y `GMAIL_APP_PASSWORD`
2. Verificar que Gmail SMTP está habilitado
3. Revisar logs: `Error enviando email con Gmail:`
4. Fallback a SendGrid: verificar `SENDGRID_API_KEY`

### Código no se valida
1. Verificar que código tiene exactamente 6 dígitos
2. Verificar que código en BD coincide con el ingresado
3. Revisar logs: `Codigo de verificacion incorrecto`

### Login no bloquea
1. Verificar que `emailVerified` está en false en BD
2. Revisar respuesta del backend: debe incluir `needsVerification: true`
3. Verificar que frontend maneja el error 403

### Tokens no se guardan
1. Verificar localStorage en DevTools (F12 → Application → Storage)
2. Verificar que respuesta incluye `accessToken` y `refreshToken`
3. Revisar que frontend ejecuta `localStorage.setItem()`

---

## 11. VARIABLES DE ENTORNO NECESARIAS

### Backend (.env)
```
GMAIL_USER=joblify.noreply@gmail.com
GMAIL_APP_PASSWORD=drpe slvy fusf cona
SENDGRID_API_KEY=SG.oadv_zmpt_lzuu_zqxt
JWT_SECRET=tu-secret-key
JWT_REFRESH_SECRET=tu-refresh-secret
FRONTEND_URL=http://localhost:8080
DATABASE_URL=postgresql://...
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:4000/api
```

---

**Última actualización:** 2026-05-12
**Estado:** Todos los flujos corregidos y funcionales
