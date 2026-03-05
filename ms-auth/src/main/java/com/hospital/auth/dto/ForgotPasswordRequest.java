package com.hospital.auth.dto;
import jakarta.validation.constraints.*;
import lombok.Data;
@Data
public class ForgotPasswordRequest {
    @NotBlank @Email private String email;
}
