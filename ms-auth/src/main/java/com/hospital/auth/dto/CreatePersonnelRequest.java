package com.hospital.auth.dto;
import com.hospital.auth.enums.Role;
import jakarta.validation.constraints.*;
import lombok.Data;
@Data
public class CreatePersonnelRequest {
    @NotBlank @Email private String email;
    @NotBlank private String password;
    @NotBlank private String nom;
    @NotBlank private String prenom;
    private String cin;
    private Role role;
    private Long personnelId;
}
