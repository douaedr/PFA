namespace MedicalAppointments.API.Models;

public class WaitingListEntry
{
    public int Id { get; set; }
    public int DoctorId { get; set; }
    public DateOnly WeekStartDate { get; set; }
    public string PatientName { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string? Phone { get; set; }
    public DateTime? NotifiedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User Doctor { get; set; } = default!;
}
