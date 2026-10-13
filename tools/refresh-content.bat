@echo off
cd /d "%~dp0\.."
echo ========================================
echo   BOOTLEG OS - REFRESH CONTENT INDEX
echo ========================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0refresh-content.ps1"
echo.
pause
