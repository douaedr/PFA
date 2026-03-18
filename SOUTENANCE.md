# MedSys — Guide de Soutenance
## Explication complète des modifications apportées

---

## 📌 Vue d'ensemble du projet

**MedSys** est un système de gestion hospitalière développé en architecture **microservices**. Il se compose de :

| Composant | Technologie | Rôle |
|-----------|-------------|------|
| `ms-auth` | Spring Boot (port 8082) | Authentification, gestion des utilisateurs |
| `ms-patient-personnel` | Spring Boot (port 8081) | Dossiers patients, documents, messagerie |
| `medsys-web` | React + Vite (port 5173) | Interface web pour tous les rôles |
| `medsys-mobile` | React Native + Expo | Application mobile patients |

---

## 🔐 PARTIE 1 — Sécurité des secrets et variables d'environnement

### Problème initial
Les fichiers `application.yml` contenaient des **secrets hardcodés** directement dans le code source :
```yaml
# ❌ AVANT — dans le code source visible par tout le monde
jwt:
  secret: medsys-hospital-jwt-secret-key-2026-very-long-and-secure-string
spring:
  mail:
    password: votre-app-password
  datasource:
    username: root
    password: ""
```

### Pourquoi c'est dangereux
Si ce code est mis sur GitHub (même en privé, en cas de fuite), n'importe qui peut :
- **Forger des tokens JWT** valides avec la clé secrète et se connecter en tant qu'admin
- **Accéder à la base de données** avec les identifiants
- **Envoyer des emails** via le compte SMTP

### Solution appliquée — Variables d'environnement
On remplace chaque valeur sensible par une **référence à une variable d'environnement** avec une valeur par défaut sûre pour le développement :

```yaml
# ✅ APRÈS — les vraies valeurs ne sont jamais dans le code
jwt:
  secret: ${JWT_SECRET:valeur-par-defaut-dev-non-securisee}
spring:
  mail:
    password: ${SMTP_PASSWORD:}
  datasource:
    username: ${DB_USERNAME:root}
    password: ${DB_PASSWORD:}
```

**Comment ça fonctionne :** Spring Boot lit `${NOM_VARIABLE:valeur_defaut}`. En production, on définit `JWT_SECRET=une-vraie-cle-aleatoire-de-64-caracteres` dans l'environnement du serveur. En développement, la valeur par défaut est utilisée.

### Fichiers créés
- **`.env.example`** : template documenté avec toutes les variables à configurer
- **`.gitignore`** : exclut `.env` et `uploads/` du versionnement git

### À retenir pour la soutenance
> *"Nous avons appliqué le principe de séparation des configurations. Les secrets ne doivent jamais être dans le code source. C'est une bonne pratique recommandée par l'OWASP (Open Web Application Security Project) et le standard 12-Factor App."*

---

## 🌐 PARTIE 2 — Configuration CORS

### Qu'est-ce que CORS ?
Le **Cross-Origin Resource Sharing** est un mécanisme de sécurité des navigateurs web. Quand le frontend (sur `localhost:5173`) fait une requête vers le backend (sur `localhost:8081`), le navigateur vérifie si le backend autorise cette origine.

### Problème initial — Double configuration contradictoire

**Problème 1 : `@CrossOrigin("*")` sur les controllers**
```java
// ❌ AVANT — annulait toute la configuration globale
@RestController
@CrossOrigin(origins = "*")  // ← Autorise TOUS les sites !
public class AuthController { ... }
```

Cette annotation au niveau du controller **override** la configuration globale définie dans `SecurityConfig`. Même si on configurait des origines précises dans SecurityConfig, le `@CrossOrigin("*")` ouvrait tout à nouveau.

**Problème 2 : Wildcard `"*"` dans SecurityConfig**
```java
// ❌ AVANT — n'importe quel site peut faire des requêtes
config.setAllowedOriginPatterns(List.of("*"));
config.setAllowedCredentials(false);  // ← Obligatoire avec wildcard
```

Avec `"*"`, n'importe quel site malveillant peut faire des requêtes à votre API depuis le navigateur de vos utilisateurs.

### Solution appliquée

**Étape 1 :** Supprimer les `@CrossOrigin("*")` des controllers — la configuration globale suffit.

**Étape 2 :** Injecter les origines autorisées depuis la configuration :
```java
// ✅ APRÈS — origines précises, configurable par environnement
@Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:3000}")
private String allowedOrigins;

@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    List<String> origins = Arrays.asList(allowedOrigins.split(","));
    config.setAllowedOrigins(origins);  // Origines explicites
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
    config.setAllowCredentials(true);   // Nécessaire pour les tokens
    config.setMaxAge(3600L);            // Cache la réponse preflight 1h
    ...
}
```

En production, on définit `CORS_ALLOWED_ORIGINS=https://medsys.hospital.ma` et seul ce domaine peut faire des requêtes.

### À retenir pour la soutenance
> *"CORS est la première ligne de défense côté navigateur. En configurant des origines précises, on empêche des sites tiers malveillants (phishing, XSS) de faire des requêtes authentifiées à notre API en utilisant la session d'un utilisateur connecté."*

---

## 📁 PARTIE 3 — Sécurisation des uploads de fichiers

### Problème initial
Le `DocumentService` avait plusieurs failles :

```java
// ❌ AVANT — plusieurs vulnérabilités
Path patientDir = Paths.get(uploadDir, String.valueOf(patientId));
// Pas de vérification : et si patientId = "../../../etc/passwd" ?

String extension = filename.substring(filename.lastIndexOf("."));
// Retourne ".php", ".jsp", ".exe" sans vérification !
```

### Vulnérabilités corrigées

**1. Path Traversal (Traversée de répertoire)**
Un attaquant pourrait envoyer `patientId = "../../../etc/passwd"` pour accéder à des fichiers système.

```java
// ✅ APRÈS — vérification que le chemin reste dans le bon dossier
Path uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
Path patientDir = uploadRoot.resolve(String.valueOf(patientId)).normalize();

// Si le chemin tente de sortir du dossier autorisé → rejeté
if (!patientDir.startsWith(uploadRoot)) {
    throw new IllegalArgumentException("Chemin de destination non autorisé.");
}
```

**2. Extension de fichier dangereuse**
```java
// ✅ APRÈS — whitelist des seules extensions autorisées
private String getExtension(String filename) {
    String ext = filename.substring(filename.lastIndexOf(".")).toLowerCase();
    if (ext.matches("\\.(pdf|jpg|jpeg|png|gif|bmp|webp)")) {
        return ext;
    }
    return "";  // Extension non reconnue → pas d'extension
}
```

**3. Taille de fichier**
```java
// ✅ APRÈS — limite à 5 MB côté service (en plus de Spring multipart)
if (file.getSize() > 5 * 1024 * 1024) {
    throw new IllegalArgumentException("Fichier trop volumineux. Taille maximale : 5 MB.");
}
```

### À retenir pour la soutenance
> *"Pour les uploads de fichiers, on applique la défense en profondeur : validation du type MIME, whitelist des extensions, limitation de taille, et protection contre le path traversal. Un attaquant ne doit jamais pouvoir écrire un fichier exécutable sur le serveur."*

---

## 🔒 PARTIE 4 — Configuration de sécurité Spring (SecurityConfig)

### Problème 1 — `anyRequest().permitAll()`

```java
// ❌ AVANT — toutes les routes non listées sont publiques !
.anyRequest().permitAll()
```

Cela signifiait que n'importe quelle URL non explicitement définie était accessible sans authentification. Si un développeur ajoutait un nouveau endpoint et oubliait de le protéger, il serait public.

```java
// ✅ APRÈS — par défaut, tout requiert une authentification
.anyRequest().authenticated()
```

### Problème 2 — Routes patients publiques
```java
// ❌ AVANT — n'importe qui peut lister tous les patients !
.requestMatchers("/api/v1/patients/**").permitAll()
```

```java
// ✅ APRÈS — seul le personnel autorisé peut accéder aux données patients
.requestMatchers("/api/v1/patients/**").hasAnyRole("DIRECTEUR", "ADMIN", "MEDECIN")
```

### À retenir pour la soutenance
> *"Le principe du moindre privilège : par défaut, on refuse tout. On ouvre uniquement ce qui est nécessaire. C'est plus sûr qu'autoriser tout et essayer de bloquer les exceptions."*

---

## 🪵 PARTIE 5 — Logging et gestion des erreurs

### Problème initial — Exceptions silencieuses
```java
// ❌ AVANT — les erreurs disparaissent dans le vide
} catch (Exception ignored) {}
```

Si un token JWT est malformé, ou si une donnée est invalide, l'erreur était **silencieusement avalée**. Aucune trace dans les logs, impossible de déboguer.

### Solution — Logger les erreurs significatives

```java
// ✅ APRÈS — on sait ce qui s'est passé, quand, et où
} catch (Exception e) {
    log.warn("JWT invalide sur {} {}: {}", request.getMethod(), request.getRequestURI(), e.getMessage());
}

// Pour les données invalides (PatientService) :
} catch (IllegalArgumentException e) {
    log.warn("Type d'antécédent invalide ignoré: {}", item.getType());
}
```

### Problème — Exposition d'informations internes aux clients
```java
// ❌ AVANT — le message d'erreur interne est envoyé au client
.body(new ErrorResponse(500, "Erreur interne: " + e.getMessage()));
// Exemple : "Erreur interne: Connection refused to localhost:3306"
// → révèle la stack technique !
```

```java
// ✅ APRÈS — message générique au client, détails dans les logs
log.error("Erreur interne non gérée: {}", e.getMessage(), e);
.body(new ErrorResponse(500, "Une erreur interne s'est produite."));
```

### À retenir pour la soutenance
> *"Les logs sont les yeux d'un système en production. Sans logs, on est aveugle. Mais on ne doit jamais envoyer les détails techniques d'une erreur au client final, car ça révèle la structure interne de l'application à un attaquant potentiel."*

---

## 🌍 PARTIE 6 — URL frontend externalisée

### Problème initial
```java
// ❌ AVANT — hardcodé dans EmailService.java
private static final String FRONTEND_URL = "http://localhost:5173";
```

En production, le frontend n'est pas sur `localhost:5173` — c'est peut-être `https://medsys.hospital.ma`. L'email de reset de mot de passe envoyait donc un lien qui ne fonctionnait pas.

### Solution
```java
// ✅ APRÈS — configurable par environnement
@Value("${app.frontend.url:http://localhost:5173}")
private String frontendUrl;
```

En production : `FRONTEND_URL=https://medsys.hospital.ma`

---

## 🔗 PARTIE 7 — Construction d'URL sécurisée (RdvProxyService)

### Problème initial
```java
// ❌ AVANT — concaténation directe de paramètres dans l'URL
String url = msRdvUrl + "/api/v1/rdv/" + rdvId + "/annuler?patientId=" + patientId;
```

Si `rdvId` ou `patientId` contiennent des caractères spéciaux (`?`, `&`, `#`, espaces...), l'URL construite sera malformée ou pourrait permettre une injection de paramètres.

### Solution — `UriComponentsBuilder`
```java
// ✅ APRÈS — les valeurs sont automatiquement encodées
String url = UriComponentsBuilder.fromHttpUrl(msRdvUrl)
    .path("/api/v1/rdv/{rdvId}/annuler")
    .queryParam("patientId", patientId)
    .buildAndExpand(rdvId)
    .toUriString();
// Résultat propre : http://localhost:8083/api/v1/rdv/42/annuler?patientId=7
```

`UriComponentsBuilder` est la classe Spring recommandée pour construire des URLs. Elle encode automatiquement les caractères spéciaux et évite toute injection.

---

## 🎨 PARTIE 8 — Améliorations UI/UX

### Architecture de l'interface web
L'interface utilise **React 18** avec **React Router** pour la navigation et **Axios** pour les appels API. Pas de framework CSS (pas de Bootstrap/Tailwind) — tout est en CSS personnalisé avec des **CSS Custom Properties** (variables CSS).

### Améliorations apportées

**1. Système CSS amélioré (`index.css`)**

On a étendu le design system avec de nouveaux composants :

| Composant | Utilité |
|-----------|---------|
| **Skeleton loading** | Affichage pendant le chargement des données (mieux que spinner blanc) |
| **Sidebar layout** | Navigation latérale pour les dashboards |
| **Modal** | Boîtes de dialogue avec animation et overlay |
| **Toast notifications** | Messages de succès/erreur non-bloquants |
| **Tables améliorées** | Tableaux avec hover effects et tri visuel |
| **Tabs** | Navigation par onglets (pill style et tab style) |
| **Upload area** | Zone de dépôt de fichiers avec drag & drop visuel |
| **Empty states** | États vides illustrés (pas de liste vide brute) |
| **Stat cards** | Cartes de statistiques avec icônes colorées |
| **Animations staggered** | Apparition en cascade des éléments |

**2. Landing page redesignée (`LandingPage.jsx`)**
- Background avec dégradé et éléments décoratifs (cercles lumineux, grille)
- Section **hero** avec tagline animée et dégradé texte
- Badges de statut avec animation pulsante
- Cards de rôle avec effets hover avancés (glow, translation, zoom)
- Section **statistiques** du projet
- Section **fonctionnalités** avec icônes
- Responsive : s'adapte aux mobiles

**3. Page login en split-panel (`PersonnelLoginPage.jsx`)**
- **Panneau gauche** (branding) : présentation du système avec liste des avantages
- **Panneau droit** (formulaire) : formulaire épuré et centré
- Bouton **toggle mot de passe** (œil) pour voir/cacher le password
- Animations et feedback visuel améliorés
- **Mobile** : panneau gauche caché, formulaire plein écran

### À retenir pour la soutenance
> *"L'UX (expérience utilisateur) est aussi importante que la sécurité dans un système hospitalier. Le personnel médical utilise l'outil toute la journée. Une interface claire, avec des retours visuels adaptés (loading, erreurs, succès) réduit les erreurs et augmente l'efficacité."*

---

## 📐 Architecture globale (pour la soutenance)

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│   medsys-web (React, port 5173)  │  medsys-mobile (Expo)        │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTP/HTTPS + JWT Bearer Token
        ┌──────────────┴──────────────┐
        ▼                             ▼
┌──────────────────┐         ┌──────────────────────────┐
│   ms-auth        │         │  ms-patient-personnel     │
│   Port 8082      │◄───────►│  Port 8081               │
│                  │         │                          │
│ • Login/Register │         │ • Dossiers médicaux      │
│ • JWT génération │         │ • Documents patients      │
│ • Reset password │         │ • Messagerie             │
│ • Gestion users  │         │ • Rendez-vous proxy      │
└────────┬─────────┘         └──────────┬───────────────┘
         │                              │
         └──────────────┬───────────────┘
                        ▼
              ┌──────────────────┐
              │   MySQL (3307)    │
              │ ms_auth_db       │
              │ ms_patient_db    │
              └──────────────────┘
```

### Flux d'authentification JWT
```
1. Utilisateur envoie email + password → ms-auth
2. ms-auth vérifie en base de données
3. ms-auth génère un JWT signé avec JWT_SECRET
4. Le JWT est retourné au client
5. Le client stocke le JWT (sessionStorage web / AsyncStorage mobile)
6. Pour chaque requête : Authorization: Bearer <jwt>
7. JwtAuthFilter intercepte → valide la signature → extrait le rôle
8. Spring Security applique les règles (@hasRole, etc.)
```

---

## 🎯 Tableau récapitulatif des améliorations

| # | Catégorie | Ce qui a été fait | Impact |
|---|-----------|-------------------|--------|
| 1 | 🔐 Secrets | Variables d'environnement | Empêche la fuite de credentials |
| 2 | 🌐 CORS | Origines précises, suppression @CrossOrigin | Empêche les requêtes cross-site malveillantes |
| 3 | 📁 Uploads | Path traversal, whitelist extensions, taille | Empêche l'upload de fichiers dangereux |
| 4 | 🔒 Auth | `permitAll` → `authenticated`, routes protégées | Ferme les accès non-autorisés |
| 5 | 🪵 Logs | Logger les exceptions silencieuses | Permet le débogage en production |
| 6 | ⚠️ Erreurs | Masquer les détails internes au client | Empêche la fuite d'informations techniques |
| 7 | 🌍 Config | URL frontend dans variables d'env | Portabilité entre environnements |
| 8 | 🔗 URLs | UriComponentsBuilder | Prévient l'injection de paramètres |
| 9 | 🎨 UI/CSS | Design system étendu | Meilleure expérience utilisateur |
| 10 | 🖼️ Landing | Redesign complet | Première impression professionnelle |
| 11 | 🔑 Login | Split-panel + toggle password | UX améliorée pour le personnel |

---

## 💬 Questions possibles de jury et réponses

**Q : Pourquoi avez-vous choisi une architecture microservices ?**
> *Les microservices permettent de déployer et scaler chaque service indépendamment. ms-auth peut être scalé si le login est sous charge, sans toucher à ms-patient. Ils permettent aussi d'utiliser différentes technologies par service et de travailler en équipes séparées.*

**Q : Pourquoi JWT et pas les sessions ?**
> *JWT est stateless : le serveur n'a pas besoin de stocker les sessions. Idéal pour les microservices car chaque service peut valider le token localement sans appeler ms-auth. Le token contient le rôle et l'ID directement.*

**Q : Quelle est la différence entre authentification et autorisation ?**
> *L'authentification vérifie "qui vous êtes" (login + password → JWT). L'autorisation vérifie "ce que vous pouvez faire" (@hasRole, les règles dans SecurityConfig). Dans MedSys, ms-auth gère l'authentification, et chaque service gère ses propres autorisations avec le JWT.*

**Q : Qu'est-ce que le CSRF et pourquoi l'avez-vous désactivé ?**
> *CSRF (Cross-Site Request Forgery) est une attaque où un site malveillant force le navigateur d'un utilisateur à faire une requête non voulue. On le désactive car notre API utilise des tokens JWT dans les headers (pas des cookies). Le CSRF ne s'applique qu'aux cookies de session. Un JWT dans `Authorization: Bearer` ne peut pas être envoyé automatiquement par un site tiers.*

**Q : Comment sécuriseriez-vous davantage le système ?**
> *Pistes d'amélioration : rate limiting (Bucket4j/resilience4j), HTTPS obligatoire, refresh tokens à durée limitée, logs d'audit pour les actions sensibles, 2FA pour les administrateurs, OWASP Dependency Check pour les vulnérabilités dans les dépendances.*
