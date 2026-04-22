namespace MedicalAppointments.API.Models;

public enum NotificationStatus { Pending, Sent, Failed }

public class Notification
{
    public int Id { get; set; }
    public string RecipientEmail { get; set; } = default!;
    public string Subject { get; set; } = default!;
    public string Body { get; set; } = default!;
    public DateTime? SentAt { get; set; }
    public NotificationStatus Status { get; set; } = NotificationStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
