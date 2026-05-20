# Guía Rápida - Iniciar y Probar

## Paso 1: Inicia el Backend

### Opción A: Doble Click (Recomendado)
1. Abre el explorador de archivos
2. Ve a: `c:\Users\Karla\joblify\`
3. Doble click en: `START_BACKEND.bat`
4. Se abrirá una ventana con el backend corriendo

**Deberías ver:**
```
🚀 Joblify API corriendo en http://localhost:4000
📊 Ambiente: development
```

### Opción B: Terminal Manual
```bash
cd c:\Users\Karla\joblify\backend
npx tsx src/index.ts
```

---

## Paso 2: Verifica que el Backend Está Corriendo

Abre otra terminal y ejecuta:
```bash
curl http://localhost:4000/health
```

**Esperado:**
```json
{
  "status": "ok",
  "timestamp": "2026-05-12T...",
  "service": "joblify-api"
}
```

Si ves error, el backend NO está corriendo. Vuelve al Paso 1.

---

## Paso 3: Abre Postman

1. Abre Postman
2. Importa: `Joblify_Auth_Tests.postman_collection.json`
3. Selecciona request: **"1. REGISTRO - Candidato"**
4. Click en **"Send"**

**Esperado:**
```json
{
  "user": {
    "id": "...",
    "email": "candidato@test.com",
    "name": "Juan Pérez",
    "role": "candidato"
  },
  "message": "Registro exitoso. Revisa tu email para el codigo de verificacion."
}
```

---

## Paso 4: Obtén el Código de Verificación

El código se envía por email, pero para desarrollo puedes verlo en los logs del backend.

Mira la ventana del backend y busca:
```
[Email] Codigo de verificacion enviado a candidato@test.com: 123456
```

Copia el código (ej: `123456`)

---

## Paso 5: Verifica el Email

1. En Postman, abre request: **"6. VERIFICAR EMAIL - Código Correcto"**
2. Reemplaza `"code": "123456"` con el código real
3. Click en **"Send"**

**Esperado:**
```json
{
  "message": "Email verificado correctamente",
  "user": {
    "id": "...",
    "email": "candidato@test.com",
    "name": "Juan Pérez",
    "role": "candidato",
    "emailVerified": true
  },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

---

## Paso 6: Copia los Tokens

1. En la respuesta anterior, copia el valor de `accessToken`
2. En Postman, abre request: **"15. GET PROFILE - Con Token"**
3. Reemplaza `Bearer PASTE_ACCESS_TOKEN_HERE` con el token real
4. Click en **"Send"**

**Esperado:**
```json
{
  "id": "...",
  "email": "candidato@test.com",
  "name": "Juan Pérez",
  "role": "candidato",
  ...
}
```

---

## Paso 7: Prueba Login

1. En Postman, abre request: **"10. LOGIN - Email Verificado"**
2. Click en **"Send"**

**Esperado:**
```json
{
  "user": { ... },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

---

## Si Algo Falla

### Error: "Cannot GET /health"
**Problema:** Backend no está corriendo
**Solución:** Vuelve a Paso 1 y asegúrate de que el backend esté corriendo

### Error: "Cannot POST /api/auth/register"
**Problema:** Backend no está corriendo o ruta no existe
**Solución:** Verifica que veas los logs en la ventana del backend

### Error: "connect ECONNREFUSED"
**Problema:** PostgreSQL no está conectado
**Solución:** Verifica que PostgreSQL esté corriendo

### Error: "Email inválido"
**Problema:** El email en Postman no es válido
**Solución:** Usa: `candidato@test.com`

### Error: "Codigo invalido"
**Problema:** El código no es de 6 dígitos
**Solución:** Copia el código exacto del log del backend

---

## Checklist

- [ ] Backend está corriendo (ves "🚀 Joblify API corriendo")
- [ ] `/health` responde correctamente
- [ ] Registro funciona
- [ ] Ves el código en los logs del backend
- [ ] Verificación funciona
- [ ] Login funciona
- [ ] Get Profile funciona

**Si todo pasa, el sistema está funcional.**

---

## Próximos Pasos

1. Prueba todos los requests en Postman
2. Prueba diferentes roles (Empresa, Freelancer, etc.)
3. Verifica que `profileData` se guarde correctamente
4. Prueba casos de error (contraseña incorrecta, email no existe, etc.)

Ver `POSTMAN_SETUP.md` para instrucciones detalladas.
