using MedicalAppointments.API.Infrastructure;
using MedicalAppointments.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MedicalAppointments.API.Controllers;

/// <summary>
/// Endpoints internes non authentifiés pour l'intégration avec ms-patient-personnel (MedSys).
/// Accessible uniquement depuis le réseau local (localhost).
/// </summary>
[ApiController]
[Route("api/internal")]
public class InternalBridgeController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ILogger<InternalBridgeController> _logger;

    public InternalBridgeController(AppDbContext db, ILogger<InternalBridgeController> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// Retourne les rendez-vous d'un patient identifié par email.
    /// Appelé par ms-patient-personnel (RdvProxyService) sans auth.
    /// GET /api/internal/rdv/patient/{email}
    /// </summary>
    [HttpGet("rdv/patient/{email}")]
    public async Task<IActionResult> GetByPatientEmail(string email)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user is null) return Ok(Array.Empty<object>());

        var appointments = await _db.Appointments
            .Include(a => a.TimeSlot)
                .ThenInclude(t => t.Doctor)
            .Where(a => a.PatientId == user.Id)
            .OrderByDescending(a => a.TimeSlot.StartTime)
            .ToListAsync();

        var result = appointments.Select(a => new
        {
            id          = a.Id,
            date        = a.TimeSlot.StartTime.ToString("yyyy-MM-dd"),
            heure       = a.TimeSlot.StartTime.ToString("HH:mm"),
            motif       = a.Reason ?? "Consultation",
            statut      = MapStatut(a.Status),
            medecinNom  = a.TimeSlot.Doctor?.FullName,
            medecinSpecialite = (string?)null,
            service     = (string?)null,
            notes       = a.Reason
        });

        return Ok(result);
    }

    /// <summary>
    /// Annule un rendez-vous pour un patient identifié par email.
    /// PUT /api/internal/rdv/{id}/annuler?email={email}
    /// </summary>
    [HttpPut("rdv/{id}/annuler")]
    public async Task<IActionResult> AnnulerRdv(int id, [FromQuery] string email)
    {
        var appt = await _db.Appointments
            .Include(a => a.Patient)
            .Include(a => a.TimeSlot)
            .FirstOrDefaultAsync(a => a.Id == id && a.Patient.Email == email);

        if (appt is null)
            return NotFound(new { message = "Rendez-vous introuvable ou non autorisé." });

        if (appt.Status is AppointmentStatus.CancelledByPatient
                        or AppointmentStatus.CancelledByDoctor
                        or AppointmentStatus.CancelledBySecretary)
            return BadRequest(new { message = "Ce rendez-vous est déjà annulé." });

        appt.Status      = AppointmentStatus.CancelledByPatient;
        appt.CancelledAt = DateTime.UtcNow;
        appt.UpdatedAt   = DateTime.UtcNow;

        // Libérer le créneau
        if (appt.TimeSlot is not null)
        {
            appt.TimeSlot.Status    = SlotStatus.Available;
            appt.TimeSlot.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        _logger.LogInformation("[BRIDGE] RDV {Id} annulé pour {Email}", id, email);
        return Ok(new { message = "Rendez-vous annulé avec succès." });
    }

    /// <summary>
    /// Retourne les créneaux disponibles d'un médecin pour une semaine.
    /// GET /api/internal/slots?doctorEmail={email}&weekStart={date}
    /// </summary>
    [HttpGet("slots")]
    public async Task<IActionResult> GetSlots(
        [FromQuery] string doctorEmail,
        [FromQuery] DateOnly? weekStart)
    {
        var doctor = await _db.Users.FirstOrDefaultAsync(u => u.Email == doctorEmail && u.Role == UserRole.Doctor);
        if (doctor is null) return Ok(Array.Empty<object>());

        var start = weekStart ?? DateOnly.FromDateTime(DateTime.Today);
        var end   = start.AddDays(7);

        var slots = await _db.TimeSlots
            .Where(s => s.DoctorId == doctor.Id
                     && DateOnly.FromDateTime(s.StartTime) >= start
                     && DateOnly.FromDateTime(s.StartTime) < end
                     && s.Status == SlotStatus.Available)
            .OrderBy(s => s.StartTime)
            .Select(s => new
            {
                id        = s.Id,
                startTime = s.StartTime,
                endTime   = s.EndTime,
                statut    = s.Status.ToString()
            })
            .ToListAsync();

        return Ok(slots);
    }

    private static string MapStatut(AppointmentStatus s) => s switch
    {
        AppointmentStatus.Confirmed          => "CONFIRME",
        AppointmentStatus.Pending            => "EN_ATTENTE",
        AppointmentStatus.Completed          => "TERMINE",
        AppointmentStatus.CancelledByPatient
            or AppointmentStatus.CancelledByDoctor
            or AppointmentStatus.CancelledBySecretary => "ANNULE",
        AppointmentStatus.NoShow             => "ANNULE",
        _                                    => "EN_ATTENTE"
    };
}
