package com.hospital.auth.dto;
import jakarta.validation.constraints.*;
import lombok.Data;
@Data
public class ResetPasswordRequest {
    @NotBlank private String token;
    @NotBlank @Size(min=8) private String newPassword;
}
