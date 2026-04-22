package com.hospital.auth.dto;

import com.hospital.auth.enums.Role;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CreatePersonnelRequest {

    @NotBlank(message = "L'adresse email est obligatoire")
    @Email(message = "Format d'adresse email invalide")
    private String email;

    @NotBlank(message = "Le mot de passe est obligatoire")
    @Size(min = 8, message = "Le mot de passe doit comporter au moins 8 caractères")
    private String password;

    @NotBlank(message = "Le nom est obligatoire")
    @Size(max = 100, message = "Le nom ne peut dépasser 100 caractères")
    private String nom;

    @NotBlank(message = "Le prénom est obligatoire")
    @Size(max = 100, message = "Le prénom ne peut dépasser 100 caractères")
    private String prenom;

    private String cin;

    @NotNull(message = "Le rôle est obligatoire")
    private Role role;

    private Long personnelId;

    // For SECRETARY role: the doctor this secretary is assigned to manage
    private Long medecinAssigneId;
}
