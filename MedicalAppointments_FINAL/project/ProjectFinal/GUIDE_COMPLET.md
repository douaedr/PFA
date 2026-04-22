# 🏥 Guide Complet — Medical Appointments

## Structure du projet
```
MedicalAppointmentsFull/
├── backend/          ← API .NET 8
├── frontend/         ← Interface React
├── database/         ← Script SQL
└── GUIDE_COMPLET.md  ← Ce fichier
```

---

## ÉTAPE 1 — Installer les outils (une seule fois)

### 1.1 — .NET 8 SDK
Télécharge sur : https://dotnet.microsoft.com/download/dotnet/8.0
Choisis ".NET 8 SDK" → installe → vérifie : `dotnet --version`

### 1.2 — Node.js (pour le frontend React)
Télécharge sur : https://nodejs.org → choisis "LTS"
Installe → vérifie : `node --version`

---

## ÉTAPE 2 — XAMPP et la base de données

### 2.1 — Démarrer XAMPP
- Ouvre XAMPP Control Panel
- Clique Start sur MySQL → il doit être VERT

### 2.2 — Créer la base de données via la ligne de commande

Ouvre l'Explorateur Windows → navigue vers :
```
C:\xampp\mysql\bin\
```
Clique dans la barre d'adresse → tape `cmd` → Entrée

Dans le terminal qui s'ouvre :
```bash
mysql -u root
```
(mot de passe vide avec XAMPP → juste Entrée)

Tu es maintenant dans mysql. Exécute le script :
```bash
source C:/chemin/vers/MedicalAppointmentsFull/database/schema.sql
```
OU (si tu es dans le dossier MedicalAppointmentsFull) :
```bash
mysql -u root < database/schema.sql
```

### 2.3 — Vérifier
```sql
USE medical_appointments;
SHOW TABLES;
SELECT FullName, Email, Role FROM Users;
```
Tu dois voir : Dr. Admin | doctor@medical.com | Doctor

---

## ÉTAPE 3 — Lancer le Backend (.NET)

Ouvre un terminal dans le dossier `backend/MedicalAppointments.API/`

```bash
# 1. Installer les packages
dotnet restore

# 2. Installer l'outil migrations (une seule fois)
dotnet tool install --global dotnet-ef

# 3. Créer la migration
dotnet ef migrations add InitialCreate

# 4. Appliquer la migration
dotnet ef database update

# 5. Lancer l'API
dotnet run
```

✅ L'API tourne sur : http://localhost:5000
✅ Swagger sur    : http://localhost:5000/swagger

---

## ÉTAPE 4 — Lancer le Frontend (React)

Ouvre UN NOUVEAU terminal dans le dossier `frontend/`

```bash
# 1. Installer les packages Node
npm install

# 2. Lancer le frontend
npm start
```

✅ Le site s'ouvre sur : http://localhost:3000

---

## ÉTAPE 5 — Utiliser l'application

### Compte médecin par défaut :
- Email    : doctor@medical.com
- Password : Admin@123

### Flux complet :
1. Connecte-toi en tant que médecin → crée des créneaux
2. Va sur http://localhost:3000 sans te connecter → réserve un créneau anonymement
3. Le créneau devient rouge (non cliquable) en temps réel
4. Connecte-toi en tant que patient → vois tes RDV → annule

---

## ⚠️ Problèmes fréquents

### "Cannot connect to MySQL"
→ Vérifie que XAMPP MySQL est démarré (vert)
→ Vérifie appsettings.json : Password=; (vide)

### "dotnet-ef not found"
```bash
dotnet tool install --global dotnet-ef
# Ferme et rouvre le terminal
```

### "npm not found"
→ Node.js n'est pas installé → installe-le depuis nodejs.org

### "Port 5000 already in use"
→ Change le port dans backend/MedicalAppointments.API/Properties/launchSettings.json
