@echo off
REM Script para iniciar Backend y Frontend de Joblify

echo.
echo ========================================
echo   JOBLIFY - Iniciando Servicios
echo ========================================
echo.

REM Inicia Backend en una ventana separada
echo [1/2] Iniciando Backend en puerto 4000...
start "Joblify Backend" cmd /k "cd /d c:\Users\Karla\joblify\backend && npx tsx src/index.ts"

REM Espera a que el backend esté listo
timeout /t 3 /nobreak

REM Inicia Frontend en otra ventana
echo [2/2] Iniciando Frontend en puerto 8080...
start "Joblify Frontend" cmd /k "cd /d c:\Users\Karla\joblify\talent-flow && npm run dev"

echo.
echo ========================================
echo   SERVICIOS INICIADOS
echo ========================================
echo.
echo Backend:  http://localhost:4000
echo Frontend: http://localhost:8080
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause >nul
