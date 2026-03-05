package com.hospital.patient.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LoginResponse {
    private String token;
    private String type = "Bearer";
    private Long patientId;
    private String cin;
    private String nom;
    private String prenom;
}
