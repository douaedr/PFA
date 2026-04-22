# 🏥 Medical Appointments — Guide Complet A→Z

## Structure du projet
```
MedicalAppointmentsFull/
├── database/
│   └── schema.sql          ← Script SQL pour créer la BD
├── backend/
│   └── MedicalAppointments.API/
│       ├── Controllers/
│       ├── Services/
│       ├── Models/
│       ├── DTOs/
│       ├── Infrastructure/
│       ├── Hubs/
│       ├── Middlewares/
│       ├── Program.cs
│       └── appsettings.json  ← ⚠️ Configurer ici
└── frontend/
    ├── public/
    ├── src/
    │   ├── pages/
    │   ├── components/
    │   ├── services/
    │   └── context/
    └── package.json
```

---

# ═══════════════════════════════════════
# ÉTAPE 1 — INSTALLER LES OUTILS
# ═══════════════════════════════════════

## 1.1 Installer XAMPP
- Télécharger : https://www.apachefriends.org/fr/index.html
- Installer avec les options par défaut
- Lancer XAMPP Control Panel
- Cliquer START sur Apache et MySQL (les deux doivent être VERTS)

## 1.2 Installer .NET 8 SDK
- Télécharger : https://dotnet.microsoft.com/download/dotnet/8.0
- Installer le SDK (pas le Runtime)
- Vérifier : ouvrir CMD et taper :
  dotnet --version   → doit afficher 8.0.xxx

## 1.3 Installer Node.js
- Télécharger : https://nodejs.org  (version LTS)
- Installer avec les options par défaut
- Vérifier : ouvrir CMD et taper :
  node --version    → doit afficher v18.xxx ou v20.xxx
  npm --version     → doit afficher 9.xxx ou 10.xxx

## 1.4 Installer VS Code
- Télécharger : https://code.visualstudio.com
- Installer l'extension "C# Dev Kit"

---

# ═══════════════════════════════════════
# ÉTAPE 2 — CRÉER LA BASE DE DONNÉES
# ═══════════════════════════════════════

XAMPP doit être démarré (MySQL vert).

## 2.1 Ouvrir le terminal MySQL XAMPP

Ouvrir l'Explorateur Windows
Aller dans : C:\xampp\mysql\bin\
Dans la barre d'adresse, taper "cmd" puis Entrée

Dans le terminal qui s'ouvre, taper :
  mysql -u root

(Appuyer sur Entrée — pas de mot de passe avec XAMPP)

Tu dois voir :
  mysql>

## 2.2 Exécuter le script SQL

Dans le terminal mysql>, taper (adapter le chemin) :
  source C:/chemin/vers/MedicalAppointmentsFull/database/schema.sql

Exemple si tu as extrait sur le Bureau :
  source C:/Users/TonPrenom/Desktop/MedicalAppointmentsFull/database/schema.sql

Tu dois voir à la fin :
  +----------------------------------------+
  | Base de données créée avec succès !    |
  +----------------------------------------+
  | 1 | Dr. Admin | doctor@medical.com | Doctor |

## 2.3 Vérifier
  USE medical_appointments;
  SHOW TABLES;

Tu dois voir 6 tables : AuditLogs, Appointments, Notifications, TimeSlots, Users, WaitingList

Pour quitter : taper  exit

---

# ═══════════════════════════════════════
# ÉTAPE 3 — CONFIGURER LE BACKEND
# ═══════════════════════════════════════

## 3.1 Ouvrir le dossier backend dans VS Code
  File → Open Folder → MedicalAppointmentsFull/backend

## 3.2 Vérifier appsettings.json
Le fichier backend/MedicalAppointments.API/appsettings.json doit avoir :
  "Default": "Server=127.0.0.1;Port=3306;Database=medical_appointments;User=root;Password=;"
  
  ⚠️ Password= est VIDE avec XAMPP (pas de mot de passe)

---

# ═══════════════════════════════════════
# ÉTAPE 4 — LANCER LE BACKEND
# ═══════════════════════════════════════

Ouvrir un terminal dans VS Code (Terminal → New Terminal)

## 4.1 Aller dans le bon dossier
  cd MedicalAppointments.API

## 4.2 Installer les packages
  dotnet restore

## 4.3 Installer l'outil EF Core (une seule fois)
  dotnet tool install --global dotnet-ef

  Si erreur "already installed", c'est normal, continuer.

## 4.4 Créer la migration
  dotnet ef migrations add InitialCreate

## 4.5 Appliquer à la base de données
  dotnet ef database update

## 4.6 Lancer l'API
  dotnet run

Tu dois voir :
  Now listening on: http://localhost:5000
  Application started.

✅ Le backend tourne sur http://localhost:5000
✅ Swagger disponible sur http://localhost:5000

---

# ═══════════════════════════════════════
# ÉTAPE 5 — LANCER LE FRONTEND
# ═══════════════════════════════════════

Ouvrir un NOUVEAU terminal (garder le backend ouvert)

## 5.1 Aller dans le dossier frontend
  cd MedicalAppointmentsFull/frontend

## 5.2 Installer les dépendances
  npm install

  (Attendre 2-3 minutes, télécharge les packages)

## 5.3 Lancer l'application React
  npm start

Le navigateur s'ouvre automatiquement sur :
  http://localhost:3000

---

# ═══════════════════════════════════════
# ÉTAPE 6 — TESTER L'APPLICATION
# ═══════════════════════════════════════

## Page d'accueil (http://localhost:3000)
→ Cliquer "Voir les créneaux disponibles" pour réserver sans compte

## Connexion médecin
→ http://localhost:3000/login
→ Email    : doctor@medical.com
→ Password : Admin@123

## Depuis le dashboard médecin
1. Aller dans "Créer créneaux"
2. Créer quelques créneaux (ou générer en masse)
3. Retourner sur "Calendrier" pour les voir

## Tester réservation anonyme
1. Aller sur http://localhost:3000 (sans connexion)
2. Cliquer "Voir les créneaux"
3. Cliquer sur un créneau vert
4. Remplir nom, email, téléphone
5. ⚠️ NOTER le code d'annulation affiché !

## Tester réservation connecté (patient)
1. Créer un compte : http://localhost:3000/register
2. Connexion → dashboard patient
3. Cliquer sur un créneau disponible

## Tester le Swagger (API directe)
→ http://localhost:5000
→ Cliquer "Authorize" → Bearer + token JWT

---

# ═══════════════════════════════════════
# COMPTES PAR DÉFAUT
# ═══════════════════════════════════════

Médecin  : doctor@medical.com  / Admin@123
Secrétaire : (créer depuis dashboard médecin → "Gérer staff")
Patient  : (s'inscrire sur /register)

---

# ═══════════════════════════════════════
# RÉSOLUTION DES PROBLÈMES FRÉQUENTS
# ═══════════════════════════════════════

❌ "mysql n'est pas reconnu"
→ XAMPP n'est pas démarré OU aller dans C:\xampp\mysql\bin\ et lancer mysql depuis là

❌ "Unable to connect to MySQL"
→ Vérifier que MySQL est vert dans XAMPP
→ Vérifier appsettings.json : Password=; (vide)

❌ "dotnet n'est pas reconnu"
→ Redémarrer VS Code après installation de .NET SDK

❌ "Port 5000 already in use"
→ Dans Program.cs, chercher ou ajouter : app.Urls.Add("http://localhost:5001");
→ Dans frontend/package.json, changer "proxy": "http://localhost:5001"

❌ "npm n'est pas reconnu"
→ Réinstaller Node.js et redémarrer VS Code

❌ Frontend affiche "Network Error"
→ Vérifier que le backend tourne (dotnet run)
→ Vérifier que XAMPP MySQL est vert

❌ Page blanche sur http://localhost:3000
→ Attendre 30 secondes (compilation initiale)
→ Rafraîchir la page

---

# ═══════════════════════════════════════
# RÉSUMÉ DES COMMANDES
# ═══════════════════════════════════════

# Base de données (terminal XAMPP mysql\bin\)
mysql -u root
source C:/chemin/database/schema.sql

# Backend (terminal VS Code, dans MedicalAppointments.API/)
dotnet restore
dotnet tool install --global dotnet-ef
dotnet ef migrations add InitialCreate
dotnet ef database update
dotnet run

# Frontend (autre terminal, dans frontend/)
npm install
npm start
