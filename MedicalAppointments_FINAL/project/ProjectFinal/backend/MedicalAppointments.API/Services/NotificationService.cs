using MailKit.Net.Smtp;
using MedicalAppointments.API.Infrastructure;
using MedicalAppointments.API.Models;
using MimeKit;

namespace MedicalAppointments.API.Services;

public interface INotificationService
{
    Task SendWaitingListNotificationAsync(string email, string name, TimeSlot slot);
    Task SendPenaltyNotificationAsync(User patient);
    Task SendBookingConfirmationAsync(User patient, Appointment appt, TimeSlot slot);
    Task SendCancellationConfirmationAsync(User patient, TimeSlot slot);
}

public class NotificationService : INotificationService
{
    private readonly IConfiguration _config;
    private readonly AppDbContext   _db;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        IConfiguration config,
        AppDbContext db,
        ILogger<NotificationService> logger)
    {
        _config = config;
        _db     = db;
        _logger = logger;
    }

    public async Task SendWaitingListNotificationAsync(string email, string name, TimeSlot slot)
    {
        var subject = "🗓️ Un créneau vient de se libérer !";
        var body = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                <h2 style='color: #2563eb;'>Bonne nouvelle, {name} !</h2>
                <p>Un créneau vient de se libérer :</p>
                <div style='background: #f0f9ff; border-left: 4px solid #2563eb; padding: 16px; margin: 16px 0;'>
                    <strong>📅 Date :</strong> {slot.StartTime:dddd dd MMMM yyyy}<br/>
                    <strong>🕐 Heure :</strong> {slot.StartTime:HH:mm} – {slot.EndTime:HH:mm}
                </div>
                <p>Connectez-vous rapidement pour le réserver avant qu'il ne soit pris !</p>
                <p style='color: #6b7280; font-size: 12px;'>Ce message a été envoyé car vous êtes inscrit(e) sur la liste d'attente.</p>
            </div>";

        await SendEmailAsync(email, subject, body);
    }

    public async Task SendPenaltyNotificationAsync(User patient)
    {
        var subject = "⚠️ Pénalité appliquée sur votre compte";
        var body = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                <h2 style='color: #dc2626;'>Pénalité activée</h2>
                <p>Bonjour {patient.FullName},</p>
                <p>Suite à l'annulation de <strong>{patient.CancelCount} rendez-vous</strong>, 
                   votre compte a été temporairement restreint.</p>
                <div style='background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 16px 0;'>
                    <strong>Blocage jusqu'au :</strong> {patient.PenaltyUntil:dd/MM/yyyy à HH:mm}
                </div>
                <p>Pendant cette période, vous ne pourrez pas prendre de nouveaux rendez-vous.</p>
                <p>Pour toute question, contactez notre secrétariat.</p>
            </div>";

        await SendEmailAsync(patient.Email, subject, body);
    }

    public async Task SendBookingConfirmationAsync(User patient, Appointment appt, TimeSlot slot)
    {
        var subject = "✅ Confirmation de votre rendez-vous";
        var cancelInfo = appt.AnonymousToken != null
            ? $@"<div style='background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 16px 0;'>
                    <strong>⚠️ Code d'annulation :</strong> <code style='font-size: 16px; font-weight: bold;'>{appt.AnonymousToken}</code><br/>
                    <small>Conservez ce code précieusement pour pouvoir annuler votre rendez-vous.</small>
                </div>"
            : "<p>Pour annuler, connectez-vous à votre espace patient.</p>";

        var body = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                <h2 style='color: #16a34a;'>Rendez-vous confirmé ✓</h2>
                <p>Bonjour {patient.FullName},</p>
                <p>Votre rendez-vous a bien été enregistré :</p>
                <div style='background: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; margin: 16px 0;'>
                    <strong>📅 Date :</strong> {slot.StartTime:dddd dd MMMM yyyy}<br/>
                    <strong>🕐 Heure :</strong> {slot.StartTime:HH:mm} – {slot.EndTime:HH:mm}<br/>
                    {(appt.Reason != null ? $"<strong>📝 Motif :</strong> {appt.Reason}" : "")}
                </div>
                {cancelInfo}
            </div>";

        await SendEmailAsync(patient.Email, subject, body);
    }

    public async Task SendCancellationConfirmationAsync(User patient, TimeSlot slot)
    {
        var subject = "❌ Annulation de votre rendez-vous";
        var body = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                <h2 style='color: #dc2626;'>Rendez-vous annulé</h2>
                <p>Bonjour {patient.FullName},</p>
                <p>Votre rendez-vous du <strong>{slot.StartTime:dddd dd MMMM yyyy à HH:mm}</strong> 
                   a bien été annulé.</p>
                <p>Vous pouvez prendre un nouveau rendez-vous à tout moment.</p>
            </div>";

        await SendEmailAsync(patient.Email, subject, body);
    }

    // ─── Envoi SMTP via MailKit ──────────────────────────────────────────
    private async Task SendEmailAsync(string to, string subject, string htmlBody)
    {
        // Persister la notification dans la DB avant l'envoi
        var notification = new Notification
        {
            RecipientEmail = to,
            Subject        = subject,
            Body           = htmlBody,
            Status         = NotificationStatus.Pending
        };
        _db.Notifications.Add(notification);
        await _db.SaveChangesAsync();

        try
        {
            var message = new MimeMessage();
            message.From.Add(MailboxAddress.Parse(_config["Email:From"]));
            message.To  .Add(MailboxAddress.Parse(to));
            message.Subject = subject;
            message.Body    = new TextPart("html") { Text = htmlBody };

            using var smtp = new SmtpClient();
            await smtp.ConnectAsync(
                _config["Email:Host"],
                int.Parse(_config["Email:Port"]!),
                MailKit.Security.SecureSocketOptions.StartTls);
            await smtp.AuthenticateAsync(_config["Email:User"], _config["Email:Pass"]);
            await smtp.SendAsync(message);
            await smtp.DisconnectAsync(true);

            notification.Status = NotificationStatus.Sent;
            notification.SentAt = DateTime.UtcNow;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Échec envoi email vers {Email}", to);
            notification.Status = NotificationStatus.Failed;
        }
        finally
        {
            await _db.SaveChangesAsync();
        }
    }
}
