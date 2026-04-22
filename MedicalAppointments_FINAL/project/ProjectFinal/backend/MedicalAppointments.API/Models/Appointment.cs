namespace MedicalAppointments.API.Models;

public enum AppointmentStatus
{
    Pending,
    Confirmed,
    CancelledByPatient,
    CancelledByDoctor,
    CancelledBySecretary,
    Completed,
    NoShow
}

public class Appointment
{
    public int Id { get; set; }
    public int TimeSlotId { get; set; }
    public int PatientId { get; set; }
    public int BookedById { get; set; }
    public string? Reason { get; set; }
    public AppointmentStatus Status { get; set; } = AppointmentStatus.Confirmed;
    public string? AnonymousToken { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? CancelReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public TimeSlot TimeSlot { get; set; } = default!;
    public User Patient { get; set; } = default!;
    public User BookedBy { get; set; } = default!;
}
