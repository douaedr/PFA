# 🏥 ms-patient-personnel — Guide Complet

## Structure du projet

```
ms-patient-personnel/
│
├── pom.xml                                    ← Dépendances Maven
│
├── src/
│   ├── main/
│   │   ├── java/com/hospital/patient/
│   │   │   ├── MsPatientPersonnelApplication.java   ← Point d'entrée
│   │   │   │
│   │   │   ├── entity/          ← Entités JPA (tables BDD)
│   │   │   │   ├── Patient.java
│   │   │   │   ├── DossierMedical.java
│   │   │   │   ├── Consultation.java
│   │   │   │   ├── Ordonnance.java
│   │   │   │   ├── LigneOrdonnance.java
│   │   │   │   ├── Antecedent.java
│   │   │   │   ├── AnalyseLaboratoire.java
│   │   │   │   ├── Radiologie.java
│   │   │   │   ├── Hospitalisation.java
│   │   │   │   ├── CertificatMedical.java
│   │   │   │   ├── HistoriqueMedical.java
│   │   │   │   ├── EtatActuel.java
│   │   │   │   ├── Medecin.java
│   │   │   │   ├── Service.java
│   │   │   │   └── Specialite.java
│   │   │   │
│   │   │   ├── enums/           ← Enumérations
│   │   │   │   ├── Sexe.java
│   │   │   │   ├── GroupeSanguin.java
│   │   │   │   ├── TypeAntecedent.java
│   │   │   │   ├── NiveauSeverite.java
│   │   │   │   ├── StatutAnalyse.java
│   │   │   │   ├── TypeOrdonnance.java
│   │   │   │   ├── TypeCertificat.java
│   │   │   │   └── TypeExamen.java
│   │   │   │
│   │   │   ├── dto/             ← Objets de transfert de données
│   │   │   │   ├── PatientRequestDTO.java
│   │   │   │   ├── PatientResponseDTO.java
│   │   │   │   ├── ConsultationDTO.java
│   │   │   │   ├── AntecedentDTO.java
│   │   │   │   └── DossierMedicalDTO.java
│   │   │   │
│   │   │   ├── mapper/          ← Conversion Entity <-> DTO
│   │   │   │   └── PatientMapper.java
│   │   │   │
│   │   │   ├── repository/      ← Accès base de données
│   │   │   │   ├── PatientRepository.java
│   │   │   │   ├── DossierMedicalRepository.java
│   │   │   │   ├── AntecedentRepository.java
│   │   │   │   ├── OrdonnanceRepository.java
│   │   │   │   ├── MedecinRepository.java
│   │   │   │   ├── ServiceRepository.java
│   │   │   │   ├── SpecialiteRepository.java
│   │   │   │   ├── CertificatRepository.java
│   │   │   │   ├── EtatActuelRepository.java
│   │   │   │   └── HistoriqueMedicalRepository.java
│   │   │   │
│   │   │   ├── service/         ← Logique métier
│   │   │   │   └── PatientService.java
│   │   │   │
│   │   │   ├── controller/      ← Endpoints REST
│   │   │   │   └── PatientController.java
│   │   │   │
│   │   │   ├── exception/       ← Gestion des erreurs
│   │   │   │   ├── PatientNotFoundException.java
│   │   │   │   ├── PatientAlreadyExistsException.java
│   │   │   │   ├── ErrorResponse.java
│   │   │   │   └── GlobalExceptionHandler.java
│   │   │   │
│   │   │   └── config/          ← Configuration Spring
│   │   │       └── SecurityConfig.java
│   │   │
│   │   └── resources/
│   │       └── application.yml  ← Configuration BDD, port...
│   │
│   └── test/
│       └── MsPatientPersonnelApplicationTests.java
│
└── frontend/
    ├── index.html               ← Interface graphique complète
    └── diagrammes-uml.html     ← Tous les diagrammes UML

```

---

## ⚙️ Comment lancer le projet

### Prérequis
- Java 17 installé
- Maven installé
- MySQL en cours d'exécution

### Étape 1 — Configurer la base de données

Ouvre `src/main/resources/application.yml` et modifie si besoin :
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/ms_patient_db?createDatabaseIfNotExist=true
    username: root
    password: root   ← Mets ton mot de passe MySQL ici
```

La base de données `ms_patient_db` sera créée automatiquement au premier lancement.

### Étape 2 — Lancer avec Maven

```bash
cd ms-patient-personnel
mvn spring-boot:run
```

Ou depuis IntelliJ / Eclipse : Ouvrir le projet, puis lancer `MsPatientPersonnelApplication.java`.

### Étape 3 — Tester l'API

Une fois lancé, accéder à :
- **Swagger UI** : http://localhost:8081/swagger-ui.html
- **API Base** : http://localhost:8081/api/v1/patients
- **Santé** : http://localhost:8081/actuator/health

---

## 🌐 Frontend

Ouvre simplement le fichier **`frontend/index.html`** dans un navigateur.
Il contient l'interface complète de gestion des patients (pas besoin de serveur).

---

## 📊 Diagrammes UML

Ouvre **`frontend/diagrammes-uml.html`** dans un navigateur pour voir :
- Diagramme Use Case
- Diagramme de Contexte
- Diagramme de Classes
- MCD (Modèle Conceptuel)
- MLD (Modèle Logique / Tables)
- Diagrammes de Séquence
- Diagrammes de Dépendances
- Descriptions textuelles

---

## 📡 Endpoints REST disponibles

| Méthode | URL | Description |
|---------|-----|-------------|
| POST | /api/v1/patients | Créer un patient |
| GET | /api/v1/patients | Lister (paginé) |
| GET | /api/v1/patients/{id} | Patient par ID |
| GET | /api/v1/patients/cin/{cin} | Patient par CIN |
| GET | /api/v1/patients/search?q=... | Recherche |
| PUT | /api/v1/patients/{id} | Modifier |
| DELETE | /api/v1/patients/{id} | Supprimer |
| GET | /api/v1/patients/statistiques | Stats |

---

## ✅ Corrections apportées vs version originale

1. **@Builder + @NoArgsConstructor + @AllArgsConstructor** ajoutés sur toutes les entités
2. **PatientMapper** créé (fichier manquant dans l'original)
3. **PatientService** complété : update, delete, search, statistiques manquaient
4. **GlobalExceptionHandler** ajouté (gestion erreurs 404/409/400)
5. **SecurityConfig** ajouté (Spring Security configuré)
6. **@Valid** ajouté sur tous les @RequestBody du controller
7. **Pagination** ajoutée sur les endpoints liste
8. **Entité Medecin** refactorisée comme référence externe (pattern microservices correct)
9. **@JsonIgnoreProperties** ajouté pour éviter les boucles infinies JSON
10. **application.yml** complété avec springdoc, actuator, jackson

---

*Généré le 24/02/2026 — ms-patient-personnel v2.0*
