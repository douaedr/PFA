namespace MedicalAppointments.API.DTOs.Slot;

public record CreateSlotDto(
    DateTime StartTime,
    DateTime EndTime
);

public record CreateBulkSlotsDto(
    DateOnly WeekStartDate,
    TimeOnly SlotStartTime,
    TimeOnly SlotEndTime,
    int SlotDurationMinutes,
    DayOfWeek[] WorkDays
);

// ✅ FIX Bug 3 : PatientName, PatientEmail, AppointmentId ajoutés pour le calendrier médecin
public record TimeSlotResponseDto(
    int Id,
    DateTime StartTime,
    DateTime EndTime,
    string Status,
    bool IsClickable,
    string? PatientName,
    string? PatientEmail,
    int? AppointmentId
);

// ✅ FIX Bug 1 : DTO pour les créneaux hospitaliers (Analyses / Radiologie / Scanner)
public record HospitalSlotResponseDto(
    int Id,
    DateTime StartTime,
    DateTime EndTime,
    string Status,
    bool IsClickable,
    int ServiceId,
    string ServiceName
);