package com.hospital.patient.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentPatientDTO {

    private Long id;
    private String typeDocument;
    private String nomFichierOriginal;
    private String description;
    private Long tailleFichier;
    private String contentType;
    private LocalDateTime dateUpload;
}
