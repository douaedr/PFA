@echo off
echo ========================================
echo   Lancement du Frontend React
echo ========================================
cd /d "%~dp0frontend"
echo.
echo Installation des packages (premiere fois)...
npm install
echo.
echo Lancement du Frontend...
npm start
pause
