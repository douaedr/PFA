package com.hospital.patient.dto;

import com.hospital.patient.enums.GroupeSanguin;
import com.hospital.patient.enums.Sexe;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientResponseDTO {

    private Long id;
    private String nom;
    private String prenom;
    private String cin;
    private LocalDate dateNaissance;
    private Integer age;
    private Sexe sexe;
    private GroupeSanguin groupeSanguin;
    private String telephone;
    private String email;
    private String adresse;
    private String ville;
    private String mutuelle;
    private String numeroCNSS;
    private String numeroDossier;
    private LocalDateTime createdAt;
}
