package com.hospital.auth.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class RegisterPatientRequest {

    // ── Étape 1 : Compte ──────────────────────────────────────
    @NotBlank(message = "Email obligatoire")
    @Email(message = "Format email invalide")
    private String email;

    @NotBlank(message = "Mot de passe obligatoire")
    @Size(min = 8, message = "Minimum 8 caractères")
    private String password;

    // ── Étape 2 : Infos personnelles ──────────────────────────
    @NotBlank(message = "Nom obligatoire")
    private String nom;

    @NotBlank(message = "Prénom obligatoire")
    private String prenom;

    @NotBlank(message = "CIN obligatoire")
    private String cin;

    @NotNull(message = "Date de naissance obligatoire")
    private LocalDate dateNaissance;

    private String sexe;           // MASCULIN / FEMININ
    private String telephone;
    private String adresse;
    private String ville;

    // ── Étape 3 : Infos médicales ─────────────────────────────
    private String groupeSanguin;  // A_POSITIF, O_NEGATIF...
    private String mutuelle;
    private String numeroCNSS;

    // ── Étape 4 : Antécédents médicaux (optionnel) ────────────
    private List<AntecedentItem> antecedents;

    // ── Étape 5 : Ordonnances antérieures (optionnel) ─────────
    private List<OrdonnanceItem> ordonnances;

    // ── Étape 6 : Analyses antérieures (optionnel) ────────────
    private List<AnalyseItem> analyses;

    // ── Inner classes ─────────────────────────────────────────
    @Data
    public static class AntecedentItem {
        private String type;        // MEDICAL, CHIRURGICAL, FAMILIAL, ALLERGIE
        private String description;
        private LocalDate dateApparition;
        private Boolean actif = true;
    }

    @Data
    public static class OrdonnanceItem {
        private LocalDate date;
        private String type;        // TRAITEMENT_COURT, TRAITEMENT_LONG, RENOUVELLEMENT
        private String medicaments; // liste des médicaments
        private String observations;
    }

    @Data
    public static class AnalyseItem {
        private String typeAnalyse;
        private LocalDate dateAnalyse;
        private String resultats;
        private String laboratoire;
        private String statut;      // EN_ATTENTE, TERMINE, etc.
    }
}
