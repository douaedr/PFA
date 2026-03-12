package com.hospital.patient.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfilRequest {

    private String telephone;
    private String email;
    private String adresse;
    private String ville;
    private String mutuelle;
    private String numeroCNSS;
}
