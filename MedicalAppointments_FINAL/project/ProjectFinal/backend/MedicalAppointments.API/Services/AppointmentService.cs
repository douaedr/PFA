using MedicalAppointments.API.DTOs.Appointment;
using MedicalAppointments.API.Hubs;
using MedicalAppointments.API.Infrastructure;
using MedicalAppointments.API.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace MedicalAppointments.API.Services;

public interface IAppointmentService
{
    Task<AppointmentResponseDto> BookAsync(BookAppointmentDto dto, int? loggedUserId);
    Task CancelAsync(CancelAppointmentDto dto, int? loggedUserId);
    Task UpdateAsync(UpdateAppointmentDto dto, int loggedUserId);
    Task<IEnumerable<AppointmentResponseDto>> GetByPatientAsync(int patientId);
    Task<IEnumerable<AppointmentResponseDto>> GetAllAsync(int? doctorId = null);
}

public class AppointmentService : IAppointmentService
{
    private readonly AppDbContext _db;
    private readonly IHubContext<SlotHub> _hub;
    private readonly INotificationService _notif;
    private readonly ILogger<AppointmentService> _logger;

    private const int PENALTY_THRESHOLD = 3;
    private const int PENALTY_DAYS = 30;

    public AppointmentService(
        AppDbContext db,
        IHubContext<SlotHub> hub,
        INotificationService notif,
        ILogger<AppointmentService> logger)
    {
        _db = db;
        _hub = hub;
        _notif = notif;
        _logger = logger;
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  RÉSERVATION
    // ─────────────────────────────────────────────────────────────────────────
    public async Task<AppointmentResponseDto> BookAsync(BookAppointmentDto dto, int? loggedUserId)
    {
        // 1. Récupérer le créneau (avec le médecin si dispo)
        var slot = await _db.TimeSlots
            .Include(t => t.Appointment)
            .Include(t => t.Doctor)         // ✅ FIX Bug 2 : inclure le médecin
            .FirstOrDefaultAsync(t => t.Id == dto.TimeSlotId)
            ?? throw new KeyNotFoundException("Créneau introuvable.");

        if (slot.Status != SlotStatus.Available)
            throw new InvalidOperationException(
                $"Ce créneau n'est plus disponible (statut : {slot.Status}).");

        // 2. Résoudre le patient
        User patient = loggedUserId.HasValue
            ? await GetRegisteredPatientAsync(loggedUserId.Value)
            : await GetOrCreateAnonymousPatientAsync(dto);

        // 3. Vérifier la pénalité
        if (patient.PenaltyUntil.HasValue && patient.PenaltyUntil > DateTime.UtcNow)
            throw new InvalidOperationException(
                $"Vous êtes sous pénalité jusqu'au {patient.PenaltyUntil:dd/MM/yyyy HH:mm}. " +
                "Vous ne pouvez pas prendre de rendez-vous.");

        // 4. Créer le token anonyme si besoin
        string? anonToken = loggedUserId.HasValue ? null : Guid.NewGuid().ToString("N");

        // 5. Créer le rendez-vous
        var appointment = new Appointment
        {
            TimeSlotId = slot.Id,
            PatientId = patient.Id,
            BookedById = loggedUserId ?? patient.Id,
            Reason = dto.Reason,
            Status = AppointmentStatus.Confirmed,
            AnonymousToken = anonToken
        };

        // 6. Marquer le créneau comme Réservé
        slot.Status = SlotStatus.Reserved;
        slot.UpdatedAt = DateTime.UtcNow;

        _db.Appointments.Add(appointment);

        // 7. Audit
        _db.AuditLogs.Add(new AuditLog
        {
            UserId = loggedUserId ?? patient.Id,
            Action = "BOOK",
            EntityType = "Appointment",
            EntityId = 0,
            Detail = $"Créneau {slot.Id} réservé par patient {patient.Email}"
        });

        await _db.SaveChangesAsync();

        // 8. Notifier en temps réel via SignalR
        await _hub.Clients.All.SendAsync("SlotStatusChanged", new
        {
            slotId = slot.Id,
            status = slot.Status.ToString(),
            isClickable = false
        });

        // 9. Envoyer confirmation email
        try
        {
            await _notif.SendBookingConfirmationAsync(patient, appointment, slot);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur envoi confirmation de réservation");
        }

        return MapToResponse(appointment, slot, patient, anonToken);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  ANNULATION
    // ─────────────────────────────────────────────────────────────────────────
    public async Task CancelAsync(CancelAppointmentDto dto, int? loggedUserId)
    {
        var appointment = await _db.Appointments
            .Include(a => a.TimeSlot)
                .ThenInclude(t => t.Doctor)   // ✅ FIX Bug 2
            .Include(a => a.Patient)
            .FirstOrDefaultAsync(a => a.Id == dto.AppointmentId)
            ?? throw new KeyNotFoundException("Rendez-vous introuvable.");

        // Vérification d'autorisation
        User? actor = null;
        if (loggedUserId.HasValue)
        {
            actor = await _db.Users.FindAsync(loggedUserId.Value)
                ?? throw new UnauthorizedAccessException("Utilisateur introuvable.");

            bool isOwner = appointment.PatientId == loggedUserId.Value;
            bool isPrivilged = actor.Role is UserRole.Doctor or UserRole.Secretary;

            if (!isOwner && !isPrivilged)
                throw new UnauthorizedAccessException(
                    "Vous n'êtes pas autorisé à annuler ce rendez-vous.");
        }
        else
        {
            // Annulation anonyme via token
            if (string.IsNullOrEmpty(dto.AnonymousToken) ||
                appointment.AnonymousToken != dto.AnonymousToken)
                throw new UnauthorizedAccessException("Token d'annulation invalide.");
        }

        if (appointment.Status is AppointmentStatus.CancelledByPatient
                                or AppointmentStatus.CancelledByDoctor
                                or AppointmentStatus.CancelledBySecretary)
            throw new InvalidOperationException("Ce rendez-vous est déjà annulé.");

        AppointmentStatus cancelStatus = AppointmentStatus.CancelledByPatient;
        if (actor != null)
        {
            cancelStatus = actor.Role switch
            {
                UserRole.Doctor => AppointmentStatus.CancelledByDoctor,
                UserRole.Secretary => AppointmentStatus.CancelledBySecretary,
                _ => AppointmentStatus.CancelledByPatient
            };
        }

        appointment.Status = cancelStatus;
        appointment.CancelledAt = DateTime.UtcNow;
        appointment.CancelReason = dto.CancelReason;

        var slot = appointment.TimeSlot;
        slot.Status = SlotStatus.Available;
        slot.UpdatedAt = DateTime.UtcNow;

        // Pénalité patient
        if (cancelStatus == AppointmentStatus.CancelledByPatient)
        {
            appointment.Patient.CancelCount++;

            if (appointment.Patient.CancelCount >= PENALTY_THRESHOLD)
            {
                appointment.Patient.PenaltyUntil = DateTime.UtcNow.AddDays(PENALTY_DAYS);
                _logger.LogWarning(
                    "Pénalité appliquée au patient {Id} jusqu'au {Date}",
                    appointment.Patient.Id,
                    appointment.Patient.PenaltyUntil);
            }
        }

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = loggedUserId ?? appointment.PatientId,
            Action = "CANCEL",
            EntityType = "Appointment",
            EntityId = appointment.Id,
            Detail = $"Statut: {cancelStatus}, Motif: {dto.CancelReason}"
        });

        await _db.SaveChangesAsync();

        await _hub.Clients.All.SendAsync("SlotStatusChanged", new
        {
            slotId = slot.Id,
            status = "Available",
            isClickable = true
        });

        // Notifier liste d'attente si créneau médecin
        if (slot.DoctorId.HasValue)
            await NotifyWaitingListAsync(slot);

        try
        {
            await _notif.SendCancellationConfirmationAsync(appointment.Patient, slot);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur envoi confirmation d'annulation");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  MODIFICATION (Secrétaire)
    // ─────────────────────────────────────────────────────────────────────────
    public async Task UpdateAsync(UpdateAppointmentDto dto, int loggedUserId)
    {
        var appointment = await _db.Appointments
            .Include(a => a.TimeSlot)
            .FirstOrDefaultAsync(a => a.Id == dto.AppointmentId)
            ?? throw new KeyNotFoundException("Rendez-vous introuvable.");

        var newSlot = await _db.TimeSlots
            .FirstOrDefaultAsync(t => t.Id == dto.NewTimeSlotId && t.Status == SlotStatus.Available)
            ?? throw new InvalidOperationException("Le nouveau créneau n'est pas disponible.");

        // Libérer l'ancien créneau
        appointment.TimeSlot.Status = SlotStatus.Available;
        appointment.TimeSlot.UpdatedAt = DateTime.UtcNow;

        // Occuper le nouveau
        newSlot.Status = SlotStatus.Reserved;
        newSlot.UpdatedAt = DateTime.UtcNow;

        appointment.TimeSlotId = dto.NewTimeSlotId;
        appointment.Reason = dto.Reason ?? appointment.Reason;
        appointment.UpdatedAt = DateTime.UtcNow;

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = loggedUserId,
            Action = "UPDATE",
            EntityType = "Appointment",
            EntityId = appointment.Id,
            Detail = $"Nouveau créneau: {newSlot.StartTime:dd/MM/yyyy HH:mm}"
        });

        await _db.SaveChangesAsync();

        await _hub.Clients.All.SendAsync("SlotStatusChanged", new { slotId = dto.NewTimeSlotId });
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  LECTURE
    // ─────────────────────────────────────────────────────────────────────────

    // ✅ FIX Bug 2 : Include Doctor dans GetByPatientAsync pour avoir DoctorName
    public async Task<IEnumerable<AppointmentResponseDto>> GetByPatientAsync(int patientId)
    {
        var list = await _db.Appointments
            .Where(a => a.PatientId == patientId)
            .Include(a => a.TimeSlot)
                .ThenInclude(t => t.Doctor)
            .Include(a => a.Patient)
            .OrderByDescending(a => a.TimeSlot.StartTime)
            .ToListAsync();

        return list.Select(a => MapToResponse(a, a.TimeSlot, a.Patient, null));
    }

    // ✅ FIX Bug 2 : Include Doctor dans GetAllAsync pour avoir DoctorName
    public async Task<IEnumerable<AppointmentResponseDto>> GetAllAsync(int? doctorId = null)
    {
        var query = _db.Appointments
            .Include(a => a.TimeSlot)
                .ThenInclude(t => t.Doctor)
            .Include(a => a.Patient)
            .AsQueryable();

        if (doctorId.HasValue)
            query = query.Where(a => a.TimeSlot.DoctorId == doctorId.Value);

        var list = await query
            .OrderByDescending(a => a.TimeSlot.StartTime)
            .ToListAsync();

        return list.Select(a => MapToResponse(a, a.TimeSlot, a.Patient, null));
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  HELPERS PRIVÉS
    // ─────────────────────────────────────────────────────────────────────────
    private async Task<User> GetRegisteredPatientAsync(int userId)
    {
        return await _db.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("Utilisateur introuvable.");
    }

    private async Task<User> GetOrCreateAnonymousPatientAsync(BookAppointmentDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.PatientEmail))
            throw new ArgumentException("L'email du patient est requis.");
        if (string.IsNullOrWhiteSpace(dto.PatientName))
            throw new ArgumentException("Le nom du patient est requis.");

        var existing = await _db.Users
            .FirstOrDefaultAsync(u => u.Email == dto.PatientEmail && !u.IsRegistered);

        if (existing != null) return existing;

        var anon = new User
        {
            FullName = dto.PatientName,
            Email = dto.PatientEmail,
            Phone = dto.PatientPhone,
            Role = UserRole.Patient,
            IsRegistered = false
        };
        _db.Users.Add(anon);
        await _db.SaveChangesAsync();
        return anon;
    }

    private async Task NotifyWaitingListAsync(TimeSlot slot)
    {
        var monday = slot.StartTime.Date;
        while (monday.DayOfWeek != DayOfWeek.Monday)
            monday = monday.AddDays(-1);

        var weekStart = DateOnly.FromDateTime(monday);

        var entries = await _db.WaitingList
            .Where(w => w.DoctorId == slot.DoctorId && w.WeekStartDate == weekStart)
            .ToListAsync();

        foreach (var entry in entries)
        {
            try
            {
                await _notif.SendWaitingListNotificationAsync(
                    entry.Email, entry.PatientName, slot);
                entry.NotifiedAt = DateTime.UtcNow;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Erreur notification liste attente pour {Email}", entry.Email);
            }
        }

        if (entries.Count > 0)
            await _db.SaveChangesAsync();
    }

    // ✅ FIX Bug 2 : MapToResponse inclut DoctorName, Reason, CancelReason
    private static AppointmentResponseDto MapToResponse(
        Appointment a, TimeSlot slot, User patient, string? token) =>
        new(
            a.Id,
            slot.Id,
            slot.StartTime,
            slot.EndTime,
            patient.FullName,
            patient.Email,
            a.Status.ToString(),
            token,
            a.CreatedAt,
            slot.Doctor?.FullName,   // DoctorName (null pour créneaux hospitaliers)
            a.Reason,
            a.CancelReason
        );
}