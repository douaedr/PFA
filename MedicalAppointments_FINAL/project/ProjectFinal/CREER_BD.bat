@echo off
echo ========================================
echo   Creation de la base de donnees
echo ========================================
echo.
echo IMPORTANT: Assurez-vous que XAMPP MySQL est demarré (vert)
echo.
"C:\xampp\mysql\bin\mysql.exe" -u root < "%~dp0database\schema.sql"
echo.
echo Base de donnees creee avec succes !
echo Tables creees: Users, TimeSlots, Appointments, WaitingList, Notifications, AuditLogs
echo Compte medecin: doctor@medical.com / Admin@123
echo.
pause
