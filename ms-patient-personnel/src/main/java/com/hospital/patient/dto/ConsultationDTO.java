package com.hospital.patient.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultationDTO {

    private Long id;

    @NotNull(message = "La date de consultation est obligatoire")
    private LocalDateTime dateConsultation;

    private String motif;
    private String diagnostic;
    private String observations;
    private String traitement;
    private Double poids;
    private Double taille;
    private Integer tensionSystolique;
    private Integer tensionDiastolique;
    private Double temperature;
    private Long medecinId;
    private String medecinNomComplet;
}
