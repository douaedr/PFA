package com.hospital.patient.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RendezVousDTO {

    private Long id;
    private String date;
    private String heure;
    private String motif;
    private String statut;
    private String medecinNom;
    private String medecinSpecialite;
    private String service;
    private String notes;
}
