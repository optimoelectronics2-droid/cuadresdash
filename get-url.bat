@echo off
echo Buscando URL del tunel...
findstr "https://.*trycloudflare.com" tunnel-log.txt > NUL 2>&1
if errorlevel 1 (
    echo Aun no hay URL. Espera unos segundos e intenta de nuevo.
    echo Si el tunel no esta corriendo, ejecuta start-all.bat primero.
) else (
    echo.
    for /f "tokens=* delims=" %%a in ('findstr "https://.*trycloudflare.com" tunnel-log.txt') do set "line=%%a"
    for /f "tokens=2 delims= " %%b in ('echo %line%') do set "url=%%b"
    echo URL actual del tunel: %url%
    echo.
    echo Abrela en Chrome en tu Android.
)
pause
