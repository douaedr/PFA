package com.hospital.patient.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessagePatientDTO {

    private Long id;
    private String contenu;
    private String expediteur;
    private Boolean lu;
    private Long medecinId;
    private String medecinNom;
    private LocalDateTime dateEnvoi;
}
