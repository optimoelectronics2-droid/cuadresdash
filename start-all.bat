@echo off
echo ====================================
echo  CuadreDash - Iniciando servidor...
echo ====================================
echo.

:: Start the Next.js server (hidden)
start /B "" cmd /c "npm run start > server-log.txt 2>&1"

echo [1/2] Servidor iniciado en http://localhost:3000
echo.

:: Wait for server to be ready
:wait
timeout /t 3 /nobreak > NUL
curl -s http://localhost:3000 > NUL 2>&1
if errorlevel 1 goto wait

:: Start Cloudflare Tunnel (hidden)
start /B "" cmd /c "C:\Users\Brailin\Documents\Dashboard\cloudflared.exe tunnel --url http://localhost:3000 > tunnel-log.txt 2>&1"

echo [2/2] Tunnel iniciado.
echo.
echo IMPORTANTE: La URL del tunel aparece en tunnel-log.txt
echo Buscala con: findstr "trycloudflare" tunnel-log.txt
echo.
echo Abre esa URL en Chrome en tu Android e instala la PWA.
echo.
pause
