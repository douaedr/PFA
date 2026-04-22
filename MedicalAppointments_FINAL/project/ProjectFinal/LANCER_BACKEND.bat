@echo off
echo ========================================
echo   Lancement du Backend Medical API
echo ========================================
cd /d "%~dp0backend\MedicalAppointments.API"
echo.
echo Restauration des packages...
dotnet restore
echo.
echo Lancement de l'API...
dotnet run
pause
