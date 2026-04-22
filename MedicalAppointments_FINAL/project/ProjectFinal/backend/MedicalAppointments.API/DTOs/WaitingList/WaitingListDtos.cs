namespace MedicalAppointments.API.DTOs.WaitingList;

public record JoinWaitingListDto(
    int      DoctorId,
    DateOnly WeekStartDate,
    string   PatientName,
    string   Email,
    string?  Phone
);

public record WaitingListEntryResponseDto(
    int      Id,
    int      DoctorId,
    DateOnly WeekStartDate,
    string   PatientName,
    string   Email,
    string?  Phone,
    DateTime? NotifiedAt,
    DateTime CreatedAt
);
