namespace MedicalAppointments.API.DTOs.Appointment;

public record BookAppointmentDto(
    int TimeSlotId,
    string? Reason,
    // Champs requis uniquement si le patient est anonyme (non connecté)
    string? PatientName,
    string? PatientEmail,
    string? PatientPhone
);

public record CancelAppointmentDto(
    int AppointmentId,
    string? CancelReason,
    string? AnonymousToken   // si patient non inscrit
);

public record UpdateAppointmentDto(
    int AppointmentId,
    int NewTimeSlotId,
    string? Reason
);

public record AppointmentResponseDto(
    int Id,
    int TimeSlotId,
    DateTime StartTime,
    DateTime EndTime,
    string PatientName,
    string PatientEmail,
    string Status,
    string? AnonymousToken,   // renvoyé UNE SEULE FOIS lors de la réservation anonyme
    DateTime CreatedAt,
    // ✅ FIX Bug 2 : champs ajoutés pour affichage côté patient et médecin
    string? DoctorName,
    string? Reason,
    string? CancelReason
);