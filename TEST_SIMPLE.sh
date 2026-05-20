#!/bin/bash

echo "🧪 TEST SIMPLE - JOBLIFY AUTH"
echo ""

# Test 1: Health Check
echo "1️⃣ Health Check..."
curl -s http://localhost:4000/health | jq . || echo "❌ Health check falló"
echo ""

# Test 2: Registro
echo "2️⃣ Registro..."
curl -s -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456",
    "name": "Test User",
    "role": "candidato",
    "headline": "Dev",
    "location": "Bogotá",
    "profileData": {
      "experienceYears": 3,
      "availability": "fulltime"
    }
  }' | jq . || echo "❌ Registro falló"
echo ""

# Test 3: Login (sin verificar)
echo "3️⃣ Login (sin verificar email)..."
curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }' | jq . || echo "❌ Login falló"
echo ""

echo "✅ Tests completados"
