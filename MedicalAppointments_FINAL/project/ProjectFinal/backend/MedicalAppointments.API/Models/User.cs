namespace MedicalAppointments.API.Models;

public enum UserRole { Doctor, Secretary, Patient }

public class User
{
    public int Id { get; set; }
    public string FullName { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string? Phone { get; set; }
    public string? PasswordHash { get; set; }
    public UserRole Role { get; set; } = UserRole.Patient;
    public bool IsRegistered { get; set; } = false;
    public DateTime? PenaltyUntil { get; set; }
    public int CancelCount { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<TimeSlot>     TimeSlots      { get; set; } = new List<TimeSlot>();
    public ICollection<Appointment>  Appointments   { get; set; } = new List<Appointment>();
    public ICollection<DoctorService> DoctorServices { get; set; } = new List<DoctorService>();
}
