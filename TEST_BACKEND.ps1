Write-Host "🚀 Iniciando Backend..." -ForegroundColor Green
cd c:\Users\Karla\joblify\backend

# Inicia el backend en background
$backendProcess = Start-Process -FilePath "npx" -ArgumentList "tsx src/index.ts" -PassThru -NoNewWindow -RedirectStandardOutput "backend.log" -RedirectStandardError "backend.log"
Write-Host "Backend iniciado (PID: $($backendProcess.Id))" -ForegroundColor Green

# Espera a que el backend esté listo
Write-Host "Esperando a que el backend esté listo..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Test 1: Health Check
Write-Host "`n1️⃣ Health Check..." -ForegroundColor Cyan
try {
  $response = Invoke-WebRequest -Uri "http://localhost:4000/health" -Method GET -ErrorAction Stop
  Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
  Write-Host "Response: $($response.Content)" -ForegroundColor Green
} catch {
  Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Registro
Write-Host "`n2️⃣ Registro de Candidato..." -ForegroundColor Cyan
$body = @{
  email = "test@example.com"
  password = "Test123456"
  name = "Test User"
  role = "candidato"
  headline = "Desarrollador"
  location = "Bogotá"
  profileData = @{
    experienceYears = 3
    availability = "fulltime"
    expectedSalary = 50000
    modalityPref = "remote"
  }
} | ConvertTo-Json

try {
  $response = Invoke-WebRequest -Uri "http://localhost:4000/api/auth/register" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
  Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
  Write-Host "Response: $($response.Content)" -ForegroundColor Green
} catch {
  Write-Host "❌ Error: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
  Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
}

# Detiene el backend
Write-Host "`n🛑 Deteniendo Backend..." -ForegroundColor Yellow
Stop-Process -Id $backendProcess.Id -Force

Write-Host "`n✅ Pruebas completadas" -ForegroundColor Green
