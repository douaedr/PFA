# MedSys — Système de Gestion Hospitalière

## Architecture

```
ms-auth             (port 8082) → Authentification JWT (login, register, mot de passe oublié)
ms-patient-personnel (port 8081) → CRUD patients + dossiers médicaux
medsys-web          (port 5173) → Frontend web (personnel + patients)
medsys-mobile       (Expo)      → App mobile patients
```

## 🚀 Lancement

### 1. Backend — ms-patient-personnel (port 8081)
```
Ouvrir ms-patient-personnel dans IntelliJ → ▶️
```
- Base de données : MySQL XAMPP port 3307
- Swagger : http://localhost:8081/swagger-ui.html

### 2. Backend — ms-auth (port 8082)
```
Ouvrir ms-auth dans IntelliJ → ▶️
```
- Base de données : ms_auth_db (créée automatiquement)
- Swagger : http://localhost:8082/swagger-ui.html

### 3. Frontend Web (port 5173)
```
cd medsys-web
npm install
npm run dev
```
- Accueil : http://localhost:5173
- Choisir Personnel ou Patient

### 4. App Mobile
```
cd medsys-mobile
npm install
npx expo start
```
Scanner QR code avec Expo Go (Android/iOS)

⚠️ Modifier src/api/api.js ligne 5-6 :
Remplacer 192.168.1.100 par votre IP locale (cmd → ipconfig → Adresse IPv4)

## 👤 Comptes

### Créer un compte Admin (premier démarrage)
Via Swagger http://localhost:8082/swagger-ui.html :
POST /api/v1/auth/register-admin (à adapter selon besoin)
Ou directement en base : INSERT INTO user_accounts (email, password, role, nom, prenom, enabled) 
VALUES ('admin@hospital.ma', '$2a$10$...', 'ADMIN', 'Admin', 'System', 1)

### Créer des médecins (par l'admin)
POST /api/v1/admin/personnel
{
  "email": "dr.martin@hospital.ma",
  "password": "motdepasse123",
  "nom": "Martin",
  "prenom": "Pierre",
  "role": "MEDECIN"
}

### S'inscrire comme patient
Via http://localhost:5173/patient → S'inscrire (formulaire multi-étapes 6 étapes)

## 🔐 JWT
- Token valide 24h
- Secret configurable dans application.yml (jwt.secret)
- Roles : PATIENT, MEDECIN, PERSONNEL, ADMIN

## 📧 Email (mot de passe oublié)
Configurer dans ms-auth/src/main/resources/application.yml :
spring.mail.username et spring.mail.password (Google App Password)
