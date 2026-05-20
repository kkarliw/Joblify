# Postman - Setup e Instrucciones

## Paso 1: Descargar Postman
Descarga Postman desde: https://www.postman.com/downloads/

## Paso 2: Importar Colección

1. Abre Postman
2. Click en **"Import"** (arriba a la izquierda)
3. Selecciona **"Upload Files"**
4. Busca y selecciona: `Joblify_Auth_Tests.postman_collection.json`
5. Click en **"Import"**

La colección se importará con 16 requests listos para usar.

---

## Paso 3: Configurar Variables de Entorno (Opcional pero Recomendado)

### Crear Environment

1. Click en **"Environments"** (izquierda)
2. Click en **"Create New Environment"**
3. Nombre: `Joblify Development`
4. Agrega estas variables:

```
BASE_URL = http://localhost:4000
API_PATH = /api
ACCESS_TOKEN = (se llena después de login)
REFRESH_TOKEN = (se llena después de login)
```

5. Click en **"Save"**

### Usar Variables en Requests

Reemplaza `http://localhost:4000` por `{{BASE_URL}}`

---

## Paso 4: Flujo de Pruebas Recomendado

### Test 1: Registro (Candidato)
1. Abre request **"1. REGISTRO - Candidato"**
2. Click en **"Send"**
3. Verifica respuesta:
   - Status: `201 Created`
   - NO debe incluir `accessToken` ni `refreshToken`
   - Debe incluir `verificationToken` en BD

**Nota:** Copia el `verificationCode` del email (revisa logs del backend)

---

### Test 2: Verificar Email
1. Abre request **"6. VERIFICAR EMAIL - Código Correcto"**
2. Reemplaza `"code": "123456"` con el código real del paso anterior
3. Click en **"Send"**
4. Verifica respuesta:
   - Status: `200 OK`
   - Incluye `accessToken` y `refreshToken`

**Importante:** Copia el `accessToken` y `refreshToken` para los siguientes tests

---

### Test 3: Login (Email Verificado)
1. Abre request **"10. LOGIN - Email Verificado"**
2. Click en **"Send"**
3. Verifica respuesta:
   - Status: `200 OK`
   - Incluye `accessToken` y `refreshToken`

---

### Test 4: Login (Email No Verificado)
1. Crea un nuevo usuario con request **"1. REGISTRO - Candidato"** (usa otro email)
2. SIN verificar el email, abre request **"9. LOGIN - Email No Verificado"**
3. Reemplaza email con el nuevo
4. Click en **"Send"**
5. Verifica respuesta:
   - Status: `403 Forbidden`
   - Incluye `needsVerification: true`
   - Incluye `email` del usuario

---

### Test 5: Reenviar Código
1. Abre request **"8. REENVIAR CÓDIGO"**
2. Click en **"Send"**
3. Verifica respuesta:
   - Status: `200 OK`
   - Mensaje: "Codigo de verificacion reenviado"

---

### Test 6: Forgot Password
1. Abre request **"13. FORGOT PASSWORD"**
2. Click en **"Send"**
3. Verifica respuesta:
   - Status: `200 OK`
   - Mensaje: "Si el email existe, recibiras instrucciones"

---

### Test 7: Refresh Token
1. Abre request **"14. REFRESH TOKEN"**
2. Reemplaza `"refreshToken": "PASTE_REFRESH_TOKEN_HERE"` con el token real
3. Click en **"Send"**
4. Verifica respuesta:
   - Status: `200 OK`
   - Nuevo `accessToken`

---

### Test 8: Get Profile
1. Abre request **"15. GET PROFILE - Con Token"**
2. Reemplaza `Bearer PASTE_ACCESS_TOKEN_HERE` con el token real
3. Click en **"Send"**
4. Verifica respuesta:
   - Status: `200 OK`
   - Datos del perfil del usuario

---

## Paso 5: Pruebas de Diferentes Roles

Repite el flujo con cada rol:

- **Test 2: REGISTRO - Empresa** (request #2)
- **Test 3: REGISTRO - Freelancer** (request #3)
- **Test 4: REGISTRO - Estudiante** (request #4)
- **Test 5: REGISTRO - Emprendedor** (request #5)

Verifica que `profileData` se guarde correctamente en cada caso.

---

## Paso 6: Casos de Error

### Email Incorrecto
- Request: **"12. LOGIN - Email No Existe"**
- Esperado: Status `401`, mensaje "Correo no registrado"

### Contraseña Incorrecta
- Request: **"11. LOGIN - Contraseña Incorrecta"**
- Esperado: Status `401`, mensaje "Contraseña incorrecta"

### Código Incorrecto
- Request: **"7. VERIFICAR EMAIL - Código Incorrecto"**
- Esperado: Status `400`, mensaje "Codigo de verificacion incorrecto"

---

## Checklist de Validación

- [ ] Registro crea usuario sin tokens
- [ ] Email de verificación se envía
- [ ] Código de 6 dígitos se genera
- [ ] Verificación con código correcto devuelve tokens
- [ ] Login bloquea usuarios no verificados (error 403)
- [ ] Login permite acceso a usuarios verificados
- [ ] Reenviar código funciona
- [ ] Forgot password envía email
- [ ] Refresh token genera nuevo access token
- [ ] Get profile requiere token válido
- [ ] profileData se guarda por rol
- [ ] Logout elimina refresh token

---

## Tips Útiles

### Ver Logs del Backend
```bash
cd c:\Users\Karla\joblify\backend
npx tsx src/index.ts
```

### Verificar BD Directamente
```sql
SELECT id, email, "emailVerified", "verificationToken" 
FROM users 
WHERE email = 'candidato@test.com';
```

### Copiar Token Rápidamente
En Postman, después de un login exitoso:
1. Click en la respuesta
2. Selecciona el valor de `accessToken`
3. Ctrl+C para copiar
4. Pega en el siguiente request

### Usar Pre-request Scripts
En Postman puedes automatizar esto con scripts, pero por ahora copia manualmente.

---

## Troubleshooting

### "Cannot find module 'nodemailer'"
```bash
cd backend
npm install nodemailer
```

### "column verificationToken does not exist"
```bash
cd backend
npx prisma db push
npx prisma generate
```

### Backend no inicia
```bash
cd backend
npx tsx src/index.ts
```

Verifica que PostgreSQL esté corriendo y `DATABASE_URL` sea válida.

---

**Colección lista para usar. Importa y comienza a probar.**
