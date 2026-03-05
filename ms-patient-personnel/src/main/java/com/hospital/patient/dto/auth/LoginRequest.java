package com.hospital.patient.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

@Data
public class LoginRequest {

    @NotBlank(message = "Le CIN est obligatoire")
    private String cin;

    @NotNull(message = "La date de naissance est obligatoire")
    private LocalDate dateNaissance;
}
