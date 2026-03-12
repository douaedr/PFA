package com.hospital.patient.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EnvoyerMessageRequest {

    @NotBlank(message = "Le contenu du message est obligatoire")
    @Size(max = 1000, message = "Le message ne peut pas dépasser 1000 caractères")
    private String contenu;

    private Long medecinId;
    private String medecinNom;
}
