-- ============================================================
--  Script SQL — medical_appointments
--  Compatible XAMPP MySQL
-- ============================================================

CREATE DATABASE IF NOT EXISTS medical_appointments
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE medical_appointments;

-- Users
CREATE TABLE IF NOT EXISTS Users (
    Id            INT          AUTO_INCREMENT PRIMARY KEY,
    FullName      VARCHAR(150) NOT NULL,
    Email         VARCHAR(200) NOT NULL UNIQUE,
    Phone         VARCHAR(20),
    PasswordHash  VARCHAR(255),
    Role          ENUM('Doctor','Secretary','Patient') NOT NULL DEFAULT 'Patient',
    IsRegistered  BOOLEAN      NOT NULL DEFAULT FALSE,
    PenaltyUntil  DATETIME     NULL,
    CancelCount   INT          NOT NULL DEFAULT 0,
    CreatedAt     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- TimeSlots
CREATE TABLE IF NOT EXISTS TimeSlots (
    Id          INT      AUTO_INCREMENT PRIMARY KEY,
    DoctorId    INT      NOT NULL,
    StartTime   DATETIME NOT NULL,
    EndTime     DATETIME NOT NULL,
    Status      ENUM('Available','Reserved','Cancelled','Blocked') NOT NULL DEFAULT 'Available',
    CreatedAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_slot_doctor FOREIGN KEY (DoctorId) REFERENCES Users(Id) ON DELETE CASCADE,
    UNIQUE KEY uq_doctor_slot (DoctorId, StartTime)
);

-- Appointments
CREATE TABLE IF NOT EXISTS Appointments (
    Id              INT          AUTO_INCREMENT PRIMARY KEY,
    TimeSlotId      INT          NOT NULL UNIQUE,
    PatientId       INT          NOT NULL,
    BookedById      INT          NOT NULL,
    Reason          VARCHAR(500),
    Status          ENUM('Pending','Confirmed','CancelledByPatient','CancelledByDoctor','CancelledBySecretary','Completed','NoShow') NOT NULL DEFAULT 'Confirmed',
    AnonymousToken  VARCHAR(100) NULL,
    CancelledAt     DATETIME     NULL,
    CancelReason    VARCHAR(500) NULL,
    CreatedAt       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_appt_slot    FOREIGN KEY (TimeSlotId)  REFERENCES TimeSlots(Id),
    CONSTRAINT fk_appt_patient FOREIGN KEY (PatientId)   REFERENCES Users(Id),
    CONSTRAINT fk_appt_booker  FOREIGN KEY (BookedById)  REFERENCES Users(Id)
);

-- WaitingList
CREATE TABLE IF NOT EXISTS WaitingList (
    Id              INT          AUTO_INCREMENT PRIMARY KEY,
    DoctorId        INT          NOT NULL,
    WeekStartDate   DATE         NOT NULL,
    PatientName     VARCHAR(150) NOT NULL,
    Email           VARCHAR(200) NOT NULL,
    Phone           VARCHAR(20),
    NotifiedAt      DATETIME     NULL,
    CreatedAt       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wl_doctor FOREIGN KEY (DoctorId) REFERENCES Users(Id) ON DELETE CASCADE,
    UNIQUE KEY uq_waitinglist (DoctorId, WeekStartDate, Email)
);

-- Notifications
CREATE TABLE IF NOT EXISTS Notifications (
    Id             INT          AUTO_INCREMENT PRIMARY KEY,
    RecipientEmail VARCHAR(200) NOT NULL,
    Subject        VARCHAR(255) NOT NULL,
    Body           TEXT         NOT NULL,
    SentAt         DATETIME     NULL,
    Status         ENUM('Pending','Sent','Failed') NOT NULL DEFAULT 'Pending',
    CreatedAt      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- AuditLogs
CREATE TABLE IF NOT EXISTS AuditLogs (
    Id          INT          AUTO_INCREMENT PRIMARY KEY,
    UserId      INT          NULL,
    Action      VARCHAR(100) NOT NULL,
    EntityType  VARCHAR(50)  NOT NULL,
    EntityId    INT          NOT NULL,
    Detail      TEXT,
    CreatedAt   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index
CREATE INDEX IF NOT EXISTS idx_slots_status   ON TimeSlots(DoctorId, Status);
CREATE INDEX IF NOT EXISTS idx_slots_time     ON TimeSlots(StartTime);
CREATE INDEX IF NOT EXISTS idx_appt_patient   ON Appointments(PatientId);
CREATE INDEX IF NOT EXISTS idx_appt_status    ON Appointments(Status);
CREATE INDEX IF NOT EXISTS idx_wl_week        ON WaitingList(DoctorId, WeekStartDate);

-- Compte médecin par défaut (mot de passe : Admin@123)
INSERT IGNORE INTO Users (FullName, Email, PasswordHash, Role, IsRegistered)
VALUES (
    'Dr. Admin',
    'doctor@medical.com',
    '$2a$11$rBnHzFHfEz8aOZhHmgBCq.5e4QUGjvTBmRVJY3KaLNq9U5f5VuUMy',
    'Doctor',
    TRUE
);

-- ============================================================
--  Services médicaux
-- ============================================================

CREATE TABLE IF NOT EXISTS Services (
    Id          INT          AUTO_INCREMENT PRIMARY KEY,
    Name        VARCHAR(150) NOT NULL UNIQUE,
    Description VARCHAR(500) NULL,
    Icon        VARCHAR(10)  NULL,
    CreatedAt   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Liaison médecin <-> services
CREATE TABLE IF NOT EXISTS DoctorServices (
    DoctorId    INT NOT NULL,
    ServiceId   INT NOT NULL,
    PRIMARY KEY (DoctorId, ServiceId),
    CONSTRAINT fk_ds_doctor  FOREIGN KEY (DoctorId)  REFERENCES Users(Id) ON DELETE CASCADE,
    CONSTRAINT fk_ds_service FOREIGN KEY (ServiceId) REFERENCES Services(Id) ON DELETE CASCADE
);

-- Services par défaut
INSERT IGNORE INTO Services (Name, Description, Icon) VALUES
('Médecine générale',    'Consultation généraliste, bilan de santé, certificats', '🩺'),
('Cardiologie',          'Suivi cardiaque, ECG, hypertension',                    '❤️'),
('Dermatologie',         'Maladies de la peau, allergies, acné',                  '🔬'),
('Pédiatrie',            'Soins pour enfants et nourrissons',                     '👶'),
('Gynécologie',          'Suivi gynécologique, grossesse',                        '🌸'),
('Ophtalmologie',        'Bilan visuel, maladies des yeux',                       '👁️'),
('Rhumatologie',         'Arthrite, douleurs articulaires',                       '🦴'),
('Neurologie',           'Migraines, troubles nerveux',                           '🧠');

-- Associer le médecin par défaut à Médecine générale
INSERT IGNORE INTO DoctorServices (DoctorId, ServiceId)
SELECT u.Id, s.Id FROM Users u, Services s
WHERE u.Email = 'doctor@medical.com' AND s.Name = 'Médecine générale';
