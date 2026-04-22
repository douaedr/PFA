namespace MedicalAppointments.API.Models;

public enum SlotStatus { Available, Reserved, Cancelled, Blocked }

public class TimeSlot
{
    public int Id { get; set; }

    // ✅ FIX Bug 1 : DoctorId nullable pour les créneaux hospitaliers
    // (Analyses, Radiologie, Scanner → DoctorId = NULL)
    public int? DoctorId { get; set; }

    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public SlotStatus Status { get; set; } = SlotStatus.Available;

    // Pour les créneaux hospitaliers (non-spécialités)
    public int? ServiceId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User? Doctor { get; set; }
    public Service? Service { get; set; }
    public Appointment? Appointment { get; set; }
}