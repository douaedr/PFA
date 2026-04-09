@echo off
title MedSys - Demarrage
echo ================================================
echo   MedSys - Lancement des services
echo ================================================
echo.

echo [1/3] Lancement de ms-auth (port 8082)...
start "ms-auth" cmd /k "cd /d %~dp0ms-auth && mvn spring-boot:run"
timeout /t 3 /nobreak >nul

echo [2/3] Lancement de ms-patient-personnel (port 8081)...
start "ms-patient-personnel" cmd /k "cd /d %~dp0ms-patient-personnel && mvn spring-boot:run"
timeout /t 3 /nobreak >nul

echo [3/3] Lancement du frontend web (port 5173)...
start "medsys-web" cmd /k "cd /d %~dp0medsys-web && npm run dev"

echo.
echo ================================================
echo  Services en cours de demarrage...
echo  Attendre 30-60 secondes puis ouvrir :
echo  http://localhost:5173
echo ================================================
echo.
echo  Comptes de test :
echo  admin@medsys.ma       / Admin1234!
echo  directeur@medsys.ma   / Directeur1234!
echo  medecin@medsys.ma     / Medecin1234!
echo  secretaire@medsys.ma  / Secretaire1234!
echo  infirmier@medsys.ma   / Infirmier1234!
echo  (patient : cree ton compte sur /patient)
echo ================================================
pause
