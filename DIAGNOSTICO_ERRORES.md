# Diagnóstico de Errores - Postman Tests

## Paso 1: Verifica que el Backend Esté Corriendo

Abre una terminal y ejecuta:
```bash
cd c:\Users\Karla\joblify\backend
npx tsx src/index.ts
```

**Deberías ver:**
```
✅ Google OAuth configured
   Callback URL: http://localhost:4000/api/auth/google/callback
🚀 Joblify API corriendo en http://localhost:4000
📊 Ambiente: development
```

Si NO ves esto, el backend no está corriendo. Detente aquí y arréglalo.

---

## Paso 2: Verifica la Conexión a PostgreSQL

En el terminal del backend, deberías ver logs cuando hagas requests. Si ves errores de BD:

```
prisma:error Invalid `prisma.user.findUnique()` invocation
```

Significa que PostgreSQL no está conectado. Verifica:

1. PostgreSQL está corriendo
2. `DATABASE_URL` en `.env` es correcta
3. La BD existe

---

## Paso 3: Prueba Manual con curl

Abre una terminal NUEVA (NO cierres la del backend) y ejecuta:

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"Test123456\",\"name\":\"Test\",\"role\":\"candidato\"}"
```

**Esperado:**
```json
{
  "user": {
    "id": "...",
    "email": "test@example.com",
    "name": "Test",
    "role": "candidato"
  },
  "message": "Registro exitoso. Revisa tu email para el codigo de verificacion."
}
```

Si ves error, copia el error exacto y dímelo.

---

## Paso 4: Verifica Logs del Backend

Cuando hagas un request en Postman, deberías ver logs en el terminal del backend:

```
[DEBUG] Register - Role received: candidato
prisma:query SELECT ...
[Email] Codigo de verificacion enviado a test@example.com: 123456
POST /api/auth/register 201 2935.302 ms - 53
```

Si NO ves estos logs, el request no llegó al backend.

---

## Paso 5: Copia el Error Exacto

En Postman, cuando hagas un request y falle:

1. Mira la respuesta (abajo)
2. Copia el error completo
3. Pégalo aquí:

```
ERROR AQUI:
```

---

## Checklist de Diagnóstico

- [ ] Backend está corriendo en `http://localhost:4000`
- [ ] PostgreSQL está conectado
- [ ] curl manual funciona
- [ ] Ves logs en el terminal del backend
- [ ] Postman está apuntando a `http://localhost:4000`

---

## Errores Comunes y Soluciones

### Error: "Cannot POST /api/auth/register"
**Causa:** Backend no está corriendo o ruta no existe
**Solución:** 
```bash
cd backend
npx tsx src/index.ts
```

### Error: "connect ECONNREFUSED 127.0.0.1:5432"
**Causa:** PostgreSQL no está corriendo
**Solución:** Inicia PostgreSQL

### Error: "column verificationToken does not exist"
**Causa:** Migraciones no se ejecutaron
**Solución:**
```bash
cd backend
npx prisma db push
npx prisma generate
```

### Error: "Email inválido"
**Causa:** El email en el request no es válido
**Solución:** Usa un email real: `test@example.com`

### Error: "Mínimo 8 caracteres"
**Causa:** Contraseña muy corta
**Solución:** Usa: `Test123456` (mínimo 8 caracteres)

### Error: "Rol inválido"
**Causa:** El rol no es uno de los permitidos
**Solución:** Usa uno de: `candidato`, `empresa`, `freelancer`, `emprendedor`, `estudiante`, `mentor`

---

## Próximos Pasos

1. Verifica que el backend esté corriendo
2. Prueba con curl manual
3. Si curl funciona, Postman también funcionará
4. Si curl NO funciona, copia el error y dímelo

**Dime qué errores específicos ves en Postman y te ayudaré a arreglarlos.**
