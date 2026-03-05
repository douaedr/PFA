package com.hospital.auth.dto;
import lombok.*;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AuthResponse {
    private String token;
    private String type;
    private Long userId;
    private String email;
    private String nom;
    private String prenom;
    private String role;
    private Long patientId;
    private Long personnelId;
}
