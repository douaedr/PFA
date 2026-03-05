package com.hospital.patient.dto;

import com.hospital.patient.enums.GroupeSanguin;
import com.hospital.patient.enums.Sexe;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientRequestDTO {

    @NotBlank(message = "Le nom est obligatoire")
    private String nom;

    @NotBlank(message = "Le prénom est obligatoire")
    private String prenom;

    @NotBlank(message = "Le CIN est obligatoire")
    private String cin;

    @NotNull(message = "La date de naissance est obligatoire")
    @Past(message = "La date de naissance doit être dans le passé")
    private LocalDate dateNaissance;

    private Sexe sexe;
    private GroupeSanguin groupeSanguin;

    private String telephone;

    @Email(message = "Format email invalide")
    private String email;

    private String adresse;
    private String ville;
    private String mutuelle;
    private String numeroCNSS;
}
