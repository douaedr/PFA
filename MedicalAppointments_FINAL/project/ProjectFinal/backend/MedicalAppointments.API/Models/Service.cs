namespace MedicalAppointments.API.Models;

public class Service
{
    public int Id { get; set; }
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
    public string? Icon { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<DoctorService> DoctorServices { get; set; } = new List<DoctorService>();
}

public class DoctorService
{
    public int DoctorId  { get; set; }
    public int ServiceId { get; set; }

    // Navigation
    public User    Doctor  { get; set; } = default!;
    public Service Service { get; set; } = default!;
}
