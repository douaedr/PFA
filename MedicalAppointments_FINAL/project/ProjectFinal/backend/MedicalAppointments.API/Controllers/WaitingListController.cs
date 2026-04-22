using MedicalAppointments.API.DTOs.WaitingList;
using MedicalAppointments.API.Infrastructure;
using MedicalAppointments.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MedicalAppointments.API.Controllers;

[ApiController]
[Route("api/waiting-list")]
public class WaitingListController : ControllerBase
{
    private readonly AppDbContext _db;

    public WaitingListController(AppDbContext db) => _db = db;

    /// <summary>S'inscrire sur la liste d'attente — accessible à tous</summary>
    [HttpPost]
    public async Task<IActionResult> Join([FromBody] JoinWaitingListDto dto)
    {
        // Vérifier que la semaine est effectivement complète (plus de créneau disponible)
        var start = dto.WeekStartDate.ToDateTime(TimeOnly.MinValue);
        var end   = start.AddDays(7);

        bool hasAvailable = await _db.TimeSlots.AnyAsync(t =>
            t.DoctorId  == dto.DoctorId &&
            t.StartTime >= start        &&
            t.StartTime <  end          &&
            t.Status    == SlotStatus.Available);

        if (hasAvailable)
            return BadRequest(new
            {
                message = "Des créneaux sont encore disponibles cette semaine. " +
                          "Veuillez choisir un créneau directement."
            });

        // Vérifier que le médecin existe
        var doctorExists = await _db.Users.AnyAsync(
            u => u.Id == dto.DoctorId && u.Role == UserRole.Doctor);

        if (!doctorExists)
            return NotFound(new { message = "Médecin introuvable." });

        var entry = new WaitingListEntry
        {
            DoctorId      = dto.DoctorId,
            WeekStartDate = dto.WeekStartDate,
            PatientName   = dto.PatientName,
            Email         = dto.Email,
            Phone         = dto.Phone
        };

        _db.WaitingList.Add(entry);

        try
        {
            await _db.SaveChangesAsync();
            return Ok(new
            {
                message = "Inscription sur la liste d'attente confirmée. " +
                          "Vous serez notifié(e) par email dès qu'un créneau se libère.",
                entryId = entry.Id
            });
        }
        catch (DbUpdateException)
        {
            return Conflict(new
            {
                message = "Vous êtes déjà inscrit(e) sur la liste d'attente pour cette semaine."
            });
        }
    }

    /// <summary>Consulter la liste d'attente d'une semaine — Médecin / Secrétaire</summary>
    [HttpGet]
    [Authorize(Roles = "Doctor,Secretary")]
    public async Task<IActionResult> GetList(
        [FromQuery] int doctorId,
        [FromQuery] DateOnly weekStart)
    {
        var list = await _db.WaitingList
            .Where(w => w.DoctorId == doctorId && w.WeekStartDate == weekStart)
            .OrderBy(w => w.CreatedAt)
            .Select(w => new WaitingListEntryResponseDto(
                w.Id, w.DoctorId, w.WeekStartDate,
                w.PatientName, w.Email, w.Phone,
                w.NotifiedAt, w.CreatedAt))
            .ToListAsync();

        return Ok(list);
    }

    /// <summary>Se retirer de la liste d'attente</summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Leave(int id, [FromQuery] string email)
    {
        var entry = await _db.WaitingList
            .FirstOrDefaultAsync(w => w.Id == id && w.Email == email);

        if (entry is null)
            return NotFound(new { message = "Inscription introuvable." });

        _db.WaitingList.Remove(entry);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
