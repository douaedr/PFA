-- ============================================================
-- MedSys - Modele Physique de Donnees (MPD)
-- Script SQL complet pour MySQL
-- ============================================================

-- ============================================================
-- BASE DE DONNEES : ms_auth_db
-- ============================================================

CREATE DATABASE IF NOT EXISTS ms_auth_db;
USE ms_auth_db;

CREATE TABLE user_accounts (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    email               VARCHAR(255) NOT NULL UNIQUE,
    password            VARCHAR(255) NOT NULL,
    role                ENUM('PATIENT','MEDECIN','ADMIN','PERSONNEL','DIRECTEUR') NOT NULL,
    nom                 VARCHAR(255) NOT NULL,
    prenom              VARCHAR(255) NOT NULL,
    cin                 VARCHAR(50),
    enabled             BOOLEAN DEFAULT TRUE,
    reset_token         VARCHAR(255),
    reset_token_expiry  DATETIME,
    patient_id          BIGINT,
    personnel_id        BIGINT,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- BASE DE DONNEES : ms_patient_db
-- ============================================================

CREATE DATABASE IF NOT EXISTS ms_patient_db;
USE ms_patient_db;

-- --- Tables de reference ---

CREATE TABLE specialites (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    nom         VARCHAR(255) NOT NULL UNIQUE,
    code        VARCHAR(50) UNIQUE,
    description TEXT
);

CREATE TABLE services (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    nom             VARCHAR(255) NOT NULL,
    code            VARCHAR(50) UNIQUE,
    description     TEXT,
    localisation    VARCHAR(255),
    capacite_lits   INT
);

CREATE TABLE medecins_ref (
    id                          BIGINT PRIMARY KEY,
    nom                         VARCHAR(255),
    prenom                      VARCHAR(255),
    matricule                   VARCHAR(100),
    specialite_id               BIGINT,
    service_id                  BIGINT,
    derniere_synchronisation    DATETIME,
    FOREIGN KEY (specialite_id) REFERENCES specialites(id),
    FOREIGN KEY (service_id)    REFERENCES services(id)
);

-- --- Tables principales ---

CREATE TABLE dossiers_medicaux (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    numero_dossier  VARCHAR(50) NOT NULL UNIQUE,
    date_creation   DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE patients (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    nom                 VARCHAR(255) NOT NULL,
    prenom              VARCHAR(255) NOT NULL,
    cin                 VARCHAR(50) NOT NULL UNIQUE,
    date_naissance      DATE NOT NULL,
    sexe                ENUM('MASCULIN','FEMININ'),
    groupe_sanguin      ENUM('A_POSITIF','A_NEGATIF','B_POSITIF','B_NEGATIF',
                             'AB_POSITIF','AB_NEGATIF','O_POSITIF','O_NEGATIF'),
    telephone           VARCHAR(20),
    email               VARCHAR(255),
    adresse             TEXT,
    ville               VARCHAR(100),
    mutuelle            VARCHAR(255),
    numero_cnss         VARCHAR(50),
    dossier_medical_id  BIGINT UNIQUE,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (dossier_medical_id) REFERENCES dossiers_medicaux(id)
);

-- --- Tables du dossier medical ---

CREATE TABLE consultations (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    dossier_id          BIGINT NOT NULL,
    medecin_id          BIGINT,
    date_consultation   DATETIME NOT NULL,
    motif               VARCHAR(500),
    diagnostic          TEXT,
    observations        TEXT,
    traitement          TEXT,
    poids               DOUBLE,
    taille              DOUBLE,
    tension_systolique  INT,
    tension_diastolique INT,
    temperature         DOUBLE,
    FOREIGN KEY (dossier_id)  REFERENCES dossiers_medicaux(id),
    FOREIGN KEY (medecin_id)  REFERENCES medecins_ref(id)
);

CREATE TABLE antecedents (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    dossier_id      BIGINT NOT NULL,
    type_antecedent ENUM('MEDICAL','CHIRURGICAL','FAMILIAL','ALLERGIQUE',
                         'GYNECOLOGIQUE','TOXICOLOGIQUE','VACCINAL') NOT NULL,
    description     TEXT,
    date_diagnostic DATE,
    severite        ENUM('FAIBLE','MODERE','SEVERE','CRITIQUE'),
    actif           BOOLEAN DEFAULT TRUE,
    source          VARCHAR(255),
    FOREIGN KEY (dossier_id) REFERENCES dossiers_medicaux(id)
);

CREATE TABLE ordonnances (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    dossier_id      BIGINT NOT NULL,
    medecin_id      BIGINT,
    date_ordonnance DATE,
    type_ordonnance ENUM('SIMPLE','SECURISEE','BIZONE'),
    instructions    TEXT,
    est_renouvele   BOOLEAN DEFAULT FALSE,
    date_expiration DATE,
    FOREIGN KEY (dossier_id) REFERENCES dossiers_medicaux(id),
    FOREIGN KEY (medecin_id) REFERENCES medecins_ref(id)
);

CREATE TABLE lignes_ordonnance (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    ordonnance_id   BIGINT NOT NULL,
    medicament      VARCHAR(255) NOT NULL,
    dosage          VARCHAR(100),
    posologie       VARCHAR(255),
    duree_jours     INT,
    quantite        INT,
    instructions    TEXT,
    FOREIGN KEY (ordonnance_id) REFERENCES ordonnances(id)
);

CREATE TABLE analyses_laboratoire (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    dossier_id      BIGINT NOT NULL,
    date_analyse    DATE,
    date_resultat   DATE,
    type_analyse    VARCHAR(255) NOT NULL,
    resultats       TEXT,
    valeur_reference TEXT,
    statut          ENUM('EN_ATTENTE','EN_COURS','TERMINE','ANNULE'),
    severite        ENUM('FAIBLE','MODERE','SEVERE','CRITIQUE'),
    laboratoire     VARCHAR(255),
    prescripteur    VARCHAR(255),
    chemin_fichier  VARCHAR(500),
    FOREIGN KEY (dossier_id) REFERENCES dossiers_medicaux(id)
);

CREATE TABLE radiologies (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    dossier_id      BIGINT NOT NULL,
    date_examen     DATE,
    type_examen     ENUM('RADIOGRAPHIE','SCANNER','IRM','ECHOGRAPHIE',
                         'SCINTIGRAPHIE','PET_SCAN','MAMMOGRAPHIE'),
    description     TEXT,
    conclusion      TEXT,
    prescripteur    VARCHAR(255),
    radiologue      VARCHAR(255),
    chemin_fichier  VARCHAR(500),
    FOREIGN KEY (dossier_id) REFERENCES dossiers_medicaux(id)
);

CREATE TABLE hospitalisations (
    id                      BIGINT AUTO_INCREMENT PRIMARY KEY,
    dossier_id              BIGINT NOT NULL,
    service_id              BIGINT,
    medecin_responsable_id  BIGINT,
    date_entree             DATE NOT NULL,
    date_sortie             DATE,
    motif                   VARCHAR(500),
    diagnostic              TEXT,
    numero_chambre          VARCHAR(20),
    compte_rendu            TEXT,
    actif                   BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (dossier_id)             REFERENCES dossiers_medicaux(id),
    FOREIGN KEY (service_id)             REFERENCES services(id),
    FOREIGN KEY (medecin_responsable_id) REFERENCES medecins_ref(id)
);

CREATE TABLE certificats_medicaux (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    dossier_id      BIGINT NOT NULL,
    medecin_id      BIGINT,
    type_certificat ENUM('MEDICAL','APTITUDE','INAPTITUDE','INVALIDITE',
                         'DECES','HOSPITALISATION','REPOS'),
    date_emission   DATE NOT NULL,
    contenu         TEXT,
    duree_jours     INT,
    FOREIGN KEY (dossier_id) REFERENCES dossiers_medicaux(id),
    FOREIGN KEY (medecin_id) REFERENCES medecins_ref(id)
);

CREATE TABLE documents_patient (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    dossier_id          BIGINT NOT NULL,
    type_document       ENUM('ORDONNANCE','ANALYSE','RADIOLOGIE','CERTIFICAT','AUTRE') NOT NULL,
    nom_fichier_original VARCHAR(255) NOT NULL,
    nom_fichier_stocke  VARCHAR(255) NOT NULL,
    chemin_fichier      VARCHAR(500) NOT NULL,
    description         VARCHAR(500),
    taille_fichier      BIGINT,
    content_type        VARCHAR(100),
    date_upload         DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dossier_id) REFERENCES dossiers_medicaux(id)
);

CREATE TABLE messages_patient (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    dossier_id  BIGINT NOT NULL,
    contenu     VARCHAR(1000) NOT NULL,
    expediteur  ENUM('PATIENT','MEDECIN'),
    lu          BOOLEAN DEFAULT FALSE,
    medecin_id  VARCHAR(50),
    medecin_nom VARCHAR(255),
    date_envoi  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dossier_id) REFERENCES dossiers_medicaux(id)
);
