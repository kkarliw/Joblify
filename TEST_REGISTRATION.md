# Test Rápido - Registro y Verificación

## Paso 1: Registrar Usuario

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456",
    "name": "Test User",
    "role": "candidato",
    "headline": "Desarrollador",
    "location": "Bogotá",
    "profileData": {
      "experienceYears": 3,
      "availability": "fulltime",
      "expectedSalary": 50000,
      "modalityPref": "remote"
    }
  }'
```

**Esperado:**
```json
{
  "user": {
    "id": "...",
    "email": "test@example.com",
    "name": "Test User",
    "role": "candidato"
  },
  "message": "Registro exitoso. Revisa tu email para el codigo de verificacion."
}
```

**IMPORTANTE:** NO debe incluir `accessToken` ni `refreshToken`

---

## Paso 2: Verificar Email en BD

```bash
# Conectarse a PostgreSQL y ejecutar:
SELECT id, email, "verificationToken", "emailVerified", "isVerified" 
FROM users 
WHERE email = 'test@example.com';
```

**Esperado:**
- `verificationToken`: código de 6 dígitos (ej: 123456)
- `emailVerified`: false
- `isVerified`: false

---

## Paso 3: Verificar Email con Código

```bash
curl -X POST http://localhost:4000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "code": "123456"
  }'
```

**Esperado:**
```json
{
  "message": "Email verificado correctamente",
  "user": {
    "id": "...",
    "email": "test@example.com",
    "name": "Test User",
    "role": "candidato",
    "emailVerified": true
  },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

---

## Paso 4: Intentar Login Sin Verificar

```bash
# Primero, marcar email como no verificado en BD:
UPDATE users SET "emailVerified" = false WHERE email = 'test@example.com';

# Luego intentar login:
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }'
```

**Esperado:**
```json
{
  "error": "Debes verificar tu email antes de iniciar sesion. Revisa tu bandeja de entrada.",
  "needsVerification": true,
  "email": "test@example.com"
}
```

---

## Paso 5: Login Exitoso (Email Verificado)

```bash
# Marcar email como verificado:
UPDATE users SET "emailVerified" = true WHERE email = 'test@example.com';

# Luego login:
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }'
```

**Esperado:**
```json
{
  "user": {
    "id": "...",
    "email": "test@example.com",
    "name": "Test User",
    "role": "candidato",
    "avatarUrl": null,
    "profileCompletion": 25,
    "plan": "FREE"
  },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

---

## Checklist

- [ ] Registro crea usuario sin tokens
- [ ] `verificationToken` se guarda en BD
- [ ] `emailVerified` es false después del registro
- [ ] Código de 6 dígitos se genera correctamente
- [ ] Verificación con código correcto marca `emailVerified: true`
- [ ] Verificación devuelve tokens JWT
- [ ] Login bloquea usuarios no verificados
- [ ] Login permite acceso a usuarios verificados
- [ ] `profileData` se guarda correctamente en JSON

---

**Si todo pasa, el sistema está funcional.**
