-- ============================================================
--  MEDSYS — Données de test complètes
--  À exécuter dans phpMyAdmin (XAMPP port 3307) ou MySQL CLI
--
--  Ordre d'exécution :
--   1. Ce fichier crée et peuple 3 bases :
--       • ms_auth_db
--       • ms_patient_db
--       • medical_appointments
--
--  Les services Spring Boot créent les tables automatiquement
--  (ddl-auto: update). Ce script COMPLÈTE avec des données.
--  Exécutez-le APRÈS le premier démarrage des services.
-- ============================================================

-- ============================================================
-- 1. ms_auth_db  (créé par ms-auth au démarrage)
--    Les comptes sont créés par DataInitializer.
--    Ce script corrige l'ENUM si nécessaire et vérifie les comptes.
-- ============================================================

USE ms_auth_db;

-- Ajouter DOCTOR et SECRETARY à l'ENUM si la table existe déjà avec l'ancien schéma
-- (sans erreur si les valeurs existent déjà — MySQL ignore les ALTERs identiques)
ALTER TABLE user_accounts
  MODIFY COLUMN role ENUM('PATIENT','MEDECIN','ADMIN','PERSONNEL','DIRECTEUR','DOCTOR','SECRETARY') NOT NULL;

-- Vérification des comptes (lecture seule — DataInitializer s'en charge)
SELECT id, email, role, enabled,
       DATE_FORMAT(created_at, '%d/%m/%Y') AS cree_le
FROM user_accounts
ORDER BY role, email;

-- ============================================================
-- 2. ms_patient_db  (créé par ms-patient-personnel au démarrage)
-- ============================================================

USE ms_patient_db;

-- ─── Patients ────────────────────────────────────────────────
INSERT INTO patients (nom, prenom, cin, date_naissance, sexe, groupe_sanguin,
                      telephone, email, adresse, ville, mutuelle, numero_cnss,
                      created_at, updated_at)
VALUES
('Benali',   'Karim',   'PAT001', '1990-03-15', 'MASCULIN',  'B_POSITIF',
 '0612345678', 'patient@medsys.ma',  '12 Rue Hassan II', 'Casablanca', 'CNSS', '123456789',
 NOW(), NOW()),
('El Amrani','Nadia',   'PAT002', '1985-07-22', 'FEMININ',   'A_POSITIF',
 '0698765432', 'patient2@medsys.ma', '45 Avenue Mohammed V', 'Rabat', 'CNOPS', '987654321',
 NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- ─── Dossiers médicaux ────────────────────────────────────────
INSERT INTO dossiers_medicaux (numero_dossier, patient_id, date_creation)
SELECT CONCAT('DM-2026-', LPAD(p.id, 5, '0')), p.id, NOW()
FROM patients p
WHERE p.email IN ('patient@medsys.ma','patient2@medsys.ma')
  AND NOT EXISTS (
    SELECT 1 FROM dossiers_medicaux d WHERE d.patient_id = p.id
  );

-- Lier les dossiers aux patients
UPDATE patients p
JOIN dossiers_medicaux d ON d.patient_id = p.id
SET p.dossier_id = d.id
WHERE p.email IN ('patient@medsys.ma','patient2@medsys.ma');

-- ─── Antécédents ─────────────────────────────────────────────
INSERT INTO antecedents (dossier_id, type_antecedent, description, date_diagnostic, actif)
SELECT d.id, 'MEDICAL', 'Hypertension artérielle légère — suivi annuel', '2020-01-10', TRUE
FROM dossiers_medicaux d
JOIN patients p ON p.id = d.patient_id
WHERE p.email = 'patient@medsys.ma'
  AND NOT EXISTS (SELECT 1 FROM antecedents a WHERE a.dossier_id = d.id AND a.type_antecedent = 'MEDICAL');

INSERT INTO antecedents (dossier_id, type_antecedent, description, date_diagnostic, actif)
SELECT d.id, 'ALLERGIE', 'Allergie à la pénicilline', '2018-05-03', TRUE
FROM dossiers_medicaux d
JOIN patients p ON p.id = d.patient_id
WHERE p.email = 'patient@medsys.ma'
  AND NOT EXISTS (SELECT 1 FROM antecedents a WHERE a.dossier_id = d.id AND a.type_antecedent = 'ALLERGIE');

INSERT INTO antecedents (dossier_id, type_antecedent, description, date_diagnostic, actif)
SELECT d.id, 'FAMILIAL', 'Diabète de type 2 (père)', '2015-03-20', TRUE
FROM dossiers_medicaux d
JOIN patients p ON p.id = d.patient_id
WHERE p.email = 'patient2@medsys.ma'
  AND NOT EXISTS (SELECT 1 FROM antecedents a WHERE a.dossier_id = d.id);

-- ─── Consultations ────────────────────────────────────────────
INSERT INTO consultations (dossier_id, date_consultation, motif, diagnostic, traitement,
                            medecin_id, medecin_nom_complet, poids, temperature)
SELECT d.id,
       DATE_SUB(NOW(), INTERVAL 60 DAY),
       'Contrôle tension artérielle',
       'Hypertension stade 1 — PA 145/90',
       'Amlodipine 5mg 1x/jour + régime hyposodé',
       1, 'Dr. Dupont Jean', 78.5, 37.0
FROM dossiers_medicaux d
JOIN patients p ON p.id = d.patient_id
WHERE p.email = 'patient@medsys.ma'
  AND NOT EXISTS (SELECT 1 FROM consultations c WHERE c.dossier_id = d.id);

INSERT INTO consultations (dossier_id, date_consultation, motif, diagnostic, traitement,
                            medecin_id, medecin_nom_complet, poids, temperature)
SELECT d.id,
       DATE_SUB(NOW(), INTERVAL 30 DAY),
       'Bilan de suivi',
       'Amélioration — PA 130/85',
       'Poursuite traitement, contrôle dans 3 mois',
       1, 'Dr. Dupont Jean', 77.0, 36.8
FROM dossiers_medicaux d
JOIN patients p ON p.id = d.patient_id
WHERE p.email = 'patient@medsys.ma'
  AND (SELECT COUNT(*) FROM consultations c WHERE c.dossier_id = d.id) < 2;

-- ─── Ordonnances ─────────────────────────────────────────────
INSERT INTO ordonnances (dossier_id, date_ordonnance, type_ordonnance, instructions)
SELECT d.id, DATE_SUB(NOW(), INTERVAL 30 DAY), 'RENOUVELLEMENT', 'Renouveler tous les 3 mois après contrôle'
FROM dossiers_medicaux d
JOIN patients p ON p.id = d.patient_id
WHERE p.email = 'patient@medsys.ma'
  AND NOT EXISTS (SELECT 1 FROM ordonnances o WHERE o.dossier_id = d.id);

-- Lignes ordonnance
INSERT INTO lignes_ordonnance (ordonnance_id, medicament, instructions)
SELECT o.id, 'Amlodipine 5mg', '1 comprimé le matin à jeun'
FROM ordonnances o
JOIN dossiers_medicaux d ON d.id = o.dossier_id
JOIN patients p ON p.id = d.patient_id
WHERE p.email = 'patient@medsys.ma'
  AND NOT EXISTS (SELECT 1 FROM lignes_ordonnance l WHERE l.ordonnance_id = o.id);

-- ─── Analyses laboratoire ─────────────────────────────────────
INSERT INTO analyses_laboratoire (dossier_id, type_analyse, date_analyse, resultats,
                                   laboratoire, statut)
SELECT d.id, 'Bilan lipidique', DATE_SUB(NOW(), INTERVAL 10 DAY),
       'Cholestérol total : 5.2 mmol/L (limite haute)\nLDL : 3.1\nHDL : 1.4\nTG : 1.5',
       'Laboratoire Central Casablanca', 'TERMINE'
FROM dossiers_medicaux d
JOIN patients p ON p.id = d.patient_id
WHERE p.email = 'patient@medsys.ma'
  AND NOT EXISTS (SELECT 1 FROM analyses_laboratoire a WHERE a.dossier_id = d.id);

INSERT INTO analyses_laboratoire (dossier_id, type_analyse, date_analyse, resultats,
                                   laboratoire, statut)
SELECT d.id, 'NFS (Numération Formule Sanguine)', DATE_ADD(NOW(), INTERVAL 5 DAY),
       NULL, 'Laboratoire Ibn Sina Rabat', 'EN_ATTENTE'
FROM dossiers_medicaux d
JOIN patients p ON p.id = d.patient_id
WHERE p.email = 'patient2@medsys.ma'
  AND NOT EXISTS (SELECT 1 FROM analyses_laboratoire a WHERE a.dossier_id = d.id);

-- ─── Rendez-vous locaux (appointment_records) ─────────────────
-- Ces RDV s'affichent dans le portail patient même sans ms-rdv
INSERT INTO appointment_records (external_appointment_id, patient_id, doctor_id,
                                  doctor_name, specialty, appointment_date, status,
                                  notes, recorded_at, updated_at)
SELECT
    1001,
    p.id,
    1,
    'Dr. Dupont Jean',
    'Cardiologie',
    DATE_ADD(NOW(), INTERVAL 7 DAY),
    'SCHEDULED',
    'Contrôle trimestriel — tension artérielle',
    NOW(), NOW()
FROM patients p
WHERE p.email = 'patient@medsys.ma'
  AND NOT EXISTS (
    SELECT 1 FROM appointment_records r
    WHERE r.external_appointment_id = 1001
  );

INSERT INTO appointment_records (external_appointment_id, patient_id, doctor_id,
                                  doctor_name, specialty, appointment_date, status,
                                  notes, recorded_at, updated_at)
SELECT
    1002,
    p.id,
    1,
    'Dr. Dupont Jean',
    'Cardiologie',
    DATE_SUB(NOW(), INTERVAL 90 DAY),
    'COMPLETED',
    'Bilan annuel — résultats normaux',
    NOW(), NOW()
FROM patients p
WHERE p.email = 'patient@medsys.ma'
  AND NOT EXISTS (
    SELECT 1 FROM appointment_records r
    WHERE r.external_appointment_id = 1002
  );

INSERT INTO appointment_records (external_appointment_id, patient_id, doctor_id,
                                  doctor_name, specialty, appointment_date, status,
                                  notes, recorded_at, updated_at)
SELECT
    1003,
    p.id,
    1,
    'Dr. Martin Sophie',
    'Médecine générale',
    DATE_ADD(NOW(), INTERVAL 14 DAY),
    'SCHEDULED',
    'Consultation de suivi diabète familial',
    NOW(), NOW()
FROM patients p
WHERE p.email = 'patient2@medsys.ma'
  AND NOT EXISTS (
    SELECT 1 FROM appointment_records r
    WHERE r.external_appointment_id = 1003
  );

-- ─── Messages patient-médecin ──────────────────────────────────
INSERT INTO messages_patients (dossier_id, contenu, expediteur, medecin_id, date_envoi, lu)
SELECT d.id,
       'Bonjour Docteur, j''ai bien pris mes médicaments mais je ressens parfois des vertiges le matin. Est-ce normal ?',
       'PATIENT', 1, DATE_SUB(NOW(), INTERVAL 2 DAY), FALSE
FROM dossiers_medicaux d
JOIN patients p ON p.id = d.patient_id
WHERE p.email = 'patient@medsys.ma'
  AND NOT EXISTS (SELECT 1 FROM messages_patients m WHERE m.dossier_id = d.id);

INSERT INTO messages_patients (dossier_id, contenu, expediteur, medecin_id, date_envoi, lu)
SELECT d.id,
       'Bonjour M. Benali. Les vertiges matinaux peuvent être liés à la prise d''Amlodipine. Prenez-la plutôt le soir au dîner. Si les vertiges persistent plus de 3 jours, contactez-moi.',
       'MEDECIN', 1, DATE_SUB(NOW(), INTERVAL 1 DAY), FALSE
FROM dossiers_medicaux d
JOIN patients p ON p.id = d.patient_id
WHERE p.email = 'patient@medsys.ma'
  AND (SELECT COUNT(*) FROM messages_patients m WHERE m.dossier_id = d.id) < 2;

-- ─── Médecins référence ───────────────────────────────────────
INSERT INTO medecins_ref (nom, prenom, matricule, derniere_synchronisation)
VALUES
  ('Dupont', 'Jean',   'MED001', NOW()),
  ('Martin', 'Sophie', 'MED002', NOW())
ON DUPLICATE KEY UPDATE derniere_synchronisation = NOW();


-- ============================================================
-- 3. medical_appointments  (créé par le service .NET)
--    À exécuter APRÈS dotnet run une première fois (migrations)
-- ============================================================

USE medical_appointments;

-- ─── Utilisateurs ─────────────────────────────────────────────
-- Médecin — mot de passe : Medecin1234!
-- (BCrypt hash de 'Medecin1234!')
INSERT IGNORE INTO Users (FullName, Email, Phone, PasswordHash, Role, IsRegistered)
VALUES ('Dr. Dupont Jean', 'medecin@medsys.ma', '0522000001',
        '$2a$11$uqE1URMcnvhqYFfSUFmN3OEBjkzjCaxqfHLbIjr4eibJHa22VBGzG',
        'Doctor', TRUE);

-- Secrétaire — mot de passe : Secretaire1234!
INSERT IGNORE INTO Users (FullName, Email, Phone, PasswordHash, Role, IsRegistered)
VALUES ('Alami Fatima', 'secretaire@medsys.ma', '0522000002',
        '$2a$11$DXG8Wr/6oJILfxPRGQPuNeR4nmRbJY0GlPPHlHPrPj4PnPe6B.J.m',
        'Secretary', TRUE);

-- Patient 1 — mot de passe : Patient1234!
INSERT IGNORE INTO Users (FullName, Email, Phone, PasswordHash, Role, IsRegistered)
VALUES ('Benali Karim', 'patient@medsys.ma', '0612345678',
        '$2a$11$FGLW8Dz8xGVEpM8ZlqYnLehJhcCT6pmqr.ykRgVzTdpTv/BoaW5j2',
        'Patient', TRUE);

-- Patient 2 — mot de passe : Patient2_1234!
INSERT IGNORE INTO Users (FullName, Email, Phone, PasswordHash, Role, IsRegistered)
VALUES ('El Amrani Nadia', 'patient2@medsys.ma', '0698765432',
        '$2a$11$V7A5DQ/nkHZ3ygKYCT.c3O56aXg7vLyJbfkIbA3e3FzUFzTnHIJxS',
        'Patient', TRUE);

-- ─── Créneaux disponibles (2 semaines) ────────────────────────
-- Créneaux pour Dr. Dupont — lundi à vendredi, 08h-17h, tranches 30 min
-- Semaine prochaine
SET @doc_id = (SELECT Id FROM Users WHERE Email = 'medecin@medsys.ma');
SET @next_monday = DATE(DATE_ADD(NOW(), INTERVAL (8 - WEEKDAY(NOW())) % 7 DAY));

-- Lundi
INSERT IGNORE INTO TimeSlots (DoctorId, StartTime, EndTime, Status)
VALUES
(@doc_id, CONCAT(@next_monday, ' 08:00:00'), CONCAT(@next_monday, ' 08:30:00'), 'Available'),
(@doc_id, CONCAT(@next_monday, ' 08:30:00'), CONCAT(@next_monday, ' 09:00:00'), 'Available'),
(@doc_id, CONCAT(@next_monday, ' 09:00:00'), CONCAT(@next_monday, ' 09:30:00'), 'Available'),
(@doc_id, CONCAT(@next_monday, ' 09:30:00'), CONCAT(@next_monday, ' 10:00:00'), 'Available'),
(@doc_id, CONCAT(@next_monday, ' 10:00:00'), CONCAT(@next_monday, ' 10:30:00'), 'Available'),
(@doc_id, CONCAT(@next_monday, ' 10:30:00'), CONCAT(@next_monday, ' 11:00:00'), 'Available'),
(@doc_id, CONCAT(@next_monday, ' 14:00:00'), CONCAT(@next_monday, ' 14:30:00'), 'Available'),
(@doc_id, CONCAT(@next_monday, ' 14:30:00'), CONCAT(@next_monday, ' 15:00:00'), 'Available'),
(@doc_id, CONCAT(@next_monday, ' 15:00:00'), CONCAT(@next_monday, ' 15:30:00'), 'Available'),
(@doc_id, CONCAT(@next_monday, ' 15:30:00'), CONCAT(@next_monday, ' 16:00:00'), 'Available');

-- Mardi
INSERT IGNORE INTO TimeSlots (DoctorId, StartTime, EndTime, Status)
VALUES
(@doc_id, CONCAT(DATE_ADD(@next_monday, INTERVAL 1 DAY), ' 08:00:00'), CONCAT(DATE_ADD(@next_monday, INTERVAL 1 DAY), ' 08:30:00'), 'Available'),
(@doc_id, CONCAT(DATE_ADD(@next_monday, INTERVAL 1 DAY), ' 08:30:00'), CONCAT(DATE_ADD(@next_monday, INTERVAL 1 DAY), ' 09:00:00'), 'Available'),
(@doc_id, CONCAT(DATE_ADD(@next_monday, INTERVAL 1 DAY), ' 09:00:00'), CONCAT(DATE_ADD(@next_monday, INTERVAL 1 DAY), ' 09:30:00'), 'Available'),
(@doc_id, CONCAT(DATE_ADD(@next_monday, INTERVAL 1 DAY), ' 09:30:00'), CONCAT(DATE_ADD(@next_monday, INTERVAL 1 DAY), ' 10:00:00'), 'Available'),
(@doc_id, CONCAT(DATE_ADD(@next_monday, INTERVAL 1 DAY), ' 14:00:00'), CONCAT(DATE_ADD(@next_monday, INTERVAL 1 DAY), ' 14:30:00'), 'Available'),
(@doc_id, CONCAT(DATE_ADD(@next_monday, INTERVAL 1 DAY), ' 14:30:00'), CONCAT(DATE_ADD(@next_monday, INTERVAL 1 DAY), ' 15:00:00'), 'Available');

-- Mercredi
INSERT IGNORE INTO TimeSlots (DoctorId, StartTime, EndTime, Status)
VALUES
(@doc_id, CONCAT(DATE_ADD(@next_monday, INTERVAL 2 DAY), ' 08:00:00'), CONCAT(DATE_ADD(@next_monday, INTERVAL 2 DAY), ' 08:30:00'), 'Available'),
(@doc_id, CONCAT(DATE_ADD(@next_monday, INTERVAL 2 DAY), ' 08:30:00'), CONCAT(DATE_ADD(@next_monday, INTERVAL 2 DAY), ' 09:00:00'), 'Available'),
(@doc_id, CONCAT(DATE_ADD(@next_monday, INTERVAL 2 DAY), ' 09:00:00'), CONCAT(DATE_ADD(@next_monday, INTERVAL 2 DAY), ' 09:30:00'), 'Available'),
(@doc_id, CONCAT(DATE_ADD(@next_monday, INTERVAL 2 DAY), ' 14:00:00'), CONCAT(DATE_ADD(@next_monday, INTERVAL 2 DAY), ' 14:30:00'), 'Available');

-- Jeudi
INSERT IGNORE INTO TimeSlots (DoctorId, StartTime, EndTime, Status)
VALUES
(@doc_id, CONCAT(DATE_ADD(@next_monday, INTERVAL 3 DAY), ' 08:00:00'), CONCAT(DATE_ADD(@next_monday, INTERVAL 3 DAY), ' 08:30:00'), 'Available'),
(@doc_id, CONCAT(DATE_ADD(@next_monday, INTERVAL 3 DAY), ' 08:30:00'), CONCAT(DATE_ADD(@next_monday, INTERVAL 3 DAY), ' 09:00:00'), 'Available'),
(@doc_id, CONCAT(DATE_ADD(@next_monday, INTERVAL 3 DAY), ' 09:00:00'), CONCAT(DATE_ADD(@next_monday, INTERVAL 3 DAY), ' 09:30:00'), 'Available'),
(@doc_id, CONCAT(DATE_ADD(@next_monday, INTERVAL 3 DAY), ' 14:00:00'), CONCAT(DATE_ADD(@next_monday, INTERVAL 3 DAY), ' 14:30:00'), 'Available'),
(@doc_id, CONCAT(DATE_ADD(@next_monday, INTERVAL 3 DAY), ' 14:30:00'), CONCAT(DATE_ADD(@next_monday, INTERVAL 3 DAY), ' 15:00:00'), 'Available');

-- Vendredi
INSERT IGNORE INTO TimeSlots (DoctorId, StartTime, EndTime, Status)
VALUES
(@doc_id, CONCAT(DATE_ADD(@next_monday, INTERVAL 4 DAY), ' 08:00:00'), CONCAT(DATE_ADD(@next_monday, INTERVAL 4 DAY), ' 08:30:00'), 'Available'),
(@doc_id, CONCAT(DATE_ADD(@next_monday, INTERVAL 4 DAY), ' 08:30:00'), CONCAT(DATE_ADD(@next_monday, INTERVAL 4 DAY), ' 09:00:00'), 'Available'),
(@doc_id, CONCAT(DATE_ADD(@next_monday, INTERVAL 4 DAY), ' 09:00:00'), CONCAT(DATE_ADD(@next_monday, INTERVAL 4 DAY), ' 09:30:00'), 'Available');

-- ─── Un rendez-vous déjà existant pour le patient 1 ──────────
SET @patient1_id = (SELECT Id FROM Users WHERE Email = 'patient@medsys.ma');

-- Réserver le premier créneau du lundi pour le patient 1
SET @slot1 = (
    SELECT Id FROM TimeSlots
    WHERE DoctorId = @doc_id
      AND StartTime = CONCAT(@next_monday, ' 08:00:00')
    LIMIT 1
);

INSERT IGNORE INTO Appointments (TimeSlotId, PatientId, BookedById, Reason, Status)
VALUES (@slot1, @patient1_id, @patient1_id, 'Contrôle tension artérielle — suivi mensuel', 'Confirmed');

UPDATE TimeSlots SET Status = 'Reserved' WHERE Id = @slot1;

-- ─── Associer le médecin aux services ─────────────────────────
INSERT IGNORE INTO DoctorServices (DoctorId, ServiceId)
SELECT @doc_id, s.Id
FROM Services s
WHERE s.Name IN ('Cardiologie', 'Médecine générale');

-- ─── Vérification finale ──────────────────────────────────────
SELECT '=== RÉSUMÉ ===' AS '';
SELECT 'ms_patient_db — Patients' AS table_name, COUNT(*) AS nb FROM ms_patient_db.patients
UNION ALL
SELECT 'ms_patient_db — Dossiers', COUNT(*) FROM ms_patient_db.dossiers_medicaux
UNION ALL
SELECT 'ms_patient_db — Consultations', COUNT(*) FROM ms_patient_db.consultations
UNION ALL
SELECT 'ms_patient_db — RDV locaux', COUNT(*) FROM ms_patient_db.appointment_records
UNION ALL
SELECT 'ms_patient_db — Messages', COUNT(*) FROM ms_patient_db.messages_patients
UNION ALL
SELECT 'medical_appointments — Users', COUNT(*) FROM medical_appointments.Users
UNION ALL
SELECT 'medical_appointments — Créneaux', COUNT(*) FROM medical_appointments.TimeSlots
UNION ALL
SELECT 'medical_appointments — RDV', COUNT(*) FROM medical_appointments.Appointments;
