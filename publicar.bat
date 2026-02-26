@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo ════════════════════════════════════
echo   Casuarina Snacks — Publicar cambios
echo ════════════════════════════════════
echo.

:: Agregar todos los archivos modificados
git add -A

:: Pedir mensaje de commit
set /p MSG="Descripcion del cambio (Enter para usar fecha): "
if "%MSG%"=="" (
    for /f "tokens=1-3 delims=/ " %%a in ("%date%") do set HOY=%%c-%%b-%%a
    for /f "tokens=1-2 delims=:." %%a in ("%time%") do set HORA=%%a:%%b
    set MSG=Actualizacion %HOY% %HORA%
)

git commit -m "%MSG%"

echo.
echo Subiendo a GitHub...
git push origin main

echo.
if %ERRORLEVEL%==0 (
    echo  Cambios publicados en GitHub correctamente!
) else (
    echo  Hubo un error. Revisa la conexion o tus credenciales.
)
echo.
pause
