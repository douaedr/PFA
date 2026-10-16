# MedSys — Guide de démarrage rapide

## Prérequis

- **Java 21** installé (`java -version`)
- **Maven 3.9+** installé (`mvn -version`)
- **Node.js 18+** installé (`node -v`)
- **XAMPP** (ou MySQL Community) avec MySQL sur le **port 3307**
- Les variables d'environnement dans un fichier `.env` à la racine (voir `.env.example`)

---

## Étape 1 — Démarrer MySQL (XAMPP, port 3307)

### Option A : Interface graphique XAMPP
1. Ouvrir XAMPP Control Panel
2. Cliquer **Start** à côté de **MySQL**
3. Vérifier que le port affiché est **3307** (sinon modifier `my.ini` : `port=3307`)

### Option B : Ligne de commande (Windows)
```bash
# Démarrer MySQL via XAMPP en ligne de commande
"C:\xampp\mysql\bin\mysqld" --port=3307
```

### Option C : Ligne de commande (Linux/Mac)
```bash
sudo /opt/lampp/lampp start
# ou
mysqld --port=3307 &
```

### Vérification MySQL
```bash
mysql -u root -P 3307 -e "SHOW DATABASES;"
```

> Les bases `ms_auth_db` et `ms_patient_db` seront créées automatiquement au démarrage des services
> grâce à `createDatabaseIfNotExist=true` dans les URLs de connexion.

---

## Étape 2 — Démarrer ms-auth (port 8082)

Ouvrir un **nouveau terminal** :

```bash
cd ms-auth
mvn spring-boot:run
```

Attendre le message :
```
Started MsAuthApplication in X.XXX seconds
```

**Vérification :**
```bash
curl http://localhost:8082/actuator/health
# Réponse attendue : {"status":"UP"}
```

---

## Étape 3 — Démarrer ms-patient-personnel (port 8081)

Ouvrir un **nouveau terminal** :

```bash
cd ms-patient-personnel
mvn spring-boot:run
```

Attendre le message :
```
Started MsPatientPersonnelApplication in X.XXX seconds
```

**Vérification :**
```bash
curl http://localhost:8081/actuator/health
# Réponse attendue : {"status":"UP"}
```

---

## Étape 4 — Démarrer le frontend web (port 5173)

Ouvrir un **nouveau terminal** :

```bash
cd medsys-web
npm install       # première fois seulement
npm run dev
```

Ouvrir le navigateur sur : **http://localhost:5173**

---

## Étape 5 — Démarrer l'application mobile

Ouvrir un **nouveau terminal** :

```bash
cd medsys-mobile
npm install       # première fois seulement
```

**Avant de démarrer**, modifier l'IP dans `src/api/api.js` :
```bash
# Trouver votre IP locale :
# Windows : ipconfig  (chercher "Adresse IPv4")
# Linux/Mac : ip addr show  ou  ifconfig
```

Puis lancer :
```bash
npm start
# ou pour Android :
npm run android
```

---

## Vérification globale des services

```bash
# ms-auth (authentification)
curl http://localhost:8082/actuator/health

# ms-patient-personnel (patients & personnel)
curl http://localhost:8081/actuator/health

# Test login complet
curl -s -X POST http://localhost:8082/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@medsys.ma", "password": "Admin1234!"}' \
  | python3 -m json.tool
```

---

## Ports utilisés

| Service | Port | URL |
|---|---|---|
| ms-auth | 8082 | http://localhost:8082 |
| ms-patient-personnel | 8081 | http://localhost:8081 |
| medsys-web (Vite) | 5173 | http://localhost:5173 |
| MySQL (XAMPP) | 3307 | localhost:3307 |
| API Gateway (optionnel) | 8080 | http://localhost:8080 |

---

## Variables d'environnement (.env)

Copier `.env.example` en `.env` et remplir :

```env
# Base de données
DB_USERNAME=root
DB_PASSWORD=

# JWT (OBLIGATOIRE — même valeur dans les deux services)
JWT_SECRET=DEVONLYCHANGEMEDEVONLYCHANGEMEDEVONLYCHANGEMEDEVONLYCHANGEMEDEVONLYCHANGEMEDEVONLYCHA

# Email (optionnel pour les tests)
SMTP_USERNAME=votre@gmail.com
SMTP_PASSWORD=votre_app_password_gmail

# Frontend
FRONTEND_URL=http://localhost:5173
```

---

## Ordre de démarrage recommandé

```
1. MySQL (XAMPP)
2. ms-auth          → http://localhost:8082
3. ms-patient-personnel → http://localhost:8081
4. medsys-web       → http://localhost:5173
5. medsys-mobile    → Expo (téléphone ou émulateur)
```

---

## Dépannage courant

| Problème | Solution |
|---|---|
| Port 3307 refusé | Vérifier que XAMPP MySQL est démarré sur 3307 |
| `jwt.secret` absent | Vérifier le fichier `.env` ou les variables d'environnement |
| CORS bloqué | Vérifier que Vite tourne sur le port 5173 |
| Mobile ne se connecte pas | Vérifier l'IP locale dans `medsys-mobile/src/api/api.js` |
| `createDatabaseIfNotExist` erreur | Ajouter les droits CREATE à l'utilisateur MySQL |
