using System.Security.Claims;
using MedicalAppointments.API.DTOs.Appointment;
using MedicalAppointments.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedicalAppointments.API.Controllers;

[ApiController]
[Route("api/appointments")]
public class AppointmentsController : ControllerBase
{
    private readonly IAppointmentService _appts;

    public AppointmentsController(IAppointmentService appts) => _appts = appts;

    /// <summary>
    /// Réserver un créneau — accessible à tous.
    /// Patient connecté : envoyer uniquement TimeSlotId + Reason.
    /// Patient anonyme  : envoyer aussi PatientName, PatientEmail, PatientPhone.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Book([FromBody] BookAppointmentDto dto)
    {
        var userId = GetUserId();
        var result = await _appts.BookAsync(dto, userId);
        return CreatedAtAction(nameof(GetMine), new { id = result.Id }, result);
    }

    /// <summary>
    /// Annuler un rendez-vous.
    /// Patient connecté  : fournir AppointmentId (+ optionnel CancelReason).
    /// Patient anonyme   : fournir AppointmentId + AnonymousToken.
    /// Médecin/Secrétaire: fournir AppointmentId.
    /// </summary>
    [HttpDelete]
    public async Task<IActionResult> Cancel([FromBody] CancelAppointmentDto dto)
    {
        var userId = GetUserId();
        await _appts.CancelAsync(dto, userId);
        return NoContent();
    }

    /// <summary>Modifier un rendez-vous — Secrétaire uniquement</summary>
    [HttpPut]
    [Authorize(Roles = "Secretary")]
    public async Task<IActionResult> Update([FromBody] UpdateAppointmentDto dto)
    {
        var userId = GetUserId()!.Value;
        await _appts.UpdateAsync(dto, userId);
        return NoContent();
    }

    /// <summary>Mes rendez-vous — Patient connecté uniquement</summary>
    [HttpGet("mine")]
    [Authorize(Roles = "Patient")]
    public async Task<IActionResult> GetMine()
    {
        var userId = GetUserId()!.Value;
        var result = await _appts.GetByPatientAsync(userId);
        return Ok(result);
    }

    /// <summary>Tous les rendez-vous — Médecin / Secrétaire</summary>
    [HttpGet]
    [Authorize(Roles = "Doctor,Secretary")]
    public async Task<IActionResult> GetAll([FromQuery] int? doctorId)
    {
        var result = await _appts.GetAllAsync(doctorId);
        return Ok(result);
    }

    private int? GetUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return claim is null ? null : int.Parse(claim);
    }
}
