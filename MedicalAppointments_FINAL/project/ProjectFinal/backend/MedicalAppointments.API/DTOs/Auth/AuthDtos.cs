namespace MedicalAppointments.API.DTOs.Auth;

public record RegisterDto(
    string FullName,
    string Email,
    string Password,
    string? Phone
);

public record LoginDto(
    string Email,
    string Password
);

public record AuthResponseDto(
    string Token,
    string Role,
    string FullName,
    DateTime ExpiresAt
);

public record CreateStaffDto(
    string FullName,
    string Email,
    string Password,
    string? Phone,
    string Role   // "Doctor" ou "Secretary"
);
