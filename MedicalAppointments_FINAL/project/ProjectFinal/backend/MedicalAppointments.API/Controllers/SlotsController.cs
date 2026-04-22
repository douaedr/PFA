using System.Security.Claims;
using MedicalAppointments.API.DTOs.Slot;
using MedicalAppointments.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedicalAppointments.API.Controllers;

[ApiController]
[Route("api/slots")]
public class SlotsController : ControllerBase
{
    private readonly ISlotService _slots;

    public SlotsController(ISlotService slots) => _slots = slots;

    /// <summary>Calendrier d'une semaine pour un médecin — accessible à tous</summary>
    [HttpGet]
    public async Task<IActionResult> GetWeek(
        [FromQuery] int doctorId,
        [FromQuery] DateOnly weekStart)
    {
        var result = await _slots.GetWeekSlotsAsync(doctorId, weekStart);
        return Ok(result);
    }

    /// <summary>Vérifier si une semaine médecin est complète — accessible à tous</summary>
    [HttpGet("week-full")]
    public async Task<IActionResult> IsWeekFull(
        [FromQuery] int doctorId,
        [FromQuery] DateOnly weekStart)
    {
        var isFull = await _slots.IsWeekFullAsync(doctorId, weekStart);
        return Ok(new { isFull });
    }

    // ✅ FIX Bug 1 : Endpoint créneaux hospitaliers (Analyses / Radiologie / Scanner)
    /// <summary>Créneaux hospitaliers d'une semaine par service — accessible à tous</summary>
    [HttpGet("hospital")]
    public async Task<IActionResult> GetHospitalWeek(
        [FromQuery] int serviceId,
        [FromQuery] DateOnly weekStart)
    {
        var result = await _slots.GetHospitalSlotsAsync(serviceId, weekStart);
        return Ok(result);
    }

    /// <summary>Vérifier si une semaine hospitalière est complète — accessible à tous</summary>
    [HttpGet("hospital/week-full")]
    public async Task<IActionResult> IsHospitalWeekFull(
        [FromQuery] int serviceId,
        [FromQuery] DateOnly weekStart)
    {
        var isFull = await _slots.IsHospitalWeekFullAsync(serviceId, weekStart);
        return Ok(new { isFull });
    }

    /// <summary>Créer un créneau unique — Médecin uniquement</summary>
    [HttpPost]
    [Authorize(Roles = "Doctor")]
    public async Task<IActionResult> Create([FromBody] CreateSlotDto dto)
    {
        var doctorId = GetUserId();
        var result = await _slots.CreateAsync(dto, doctorId);
        return CreatedAtAction(nameof(GetWeek), result);
    }

    /// <summary>Créer plusieurs créneaux en masse — Médecin uniquement</summary>
    [HttpPost("bulk")]
    [Authorize(Roles = "Doctor")]
    public async Task<IActionResult> CreateBulk([FromBody] CreateBulkSlotsDto dto)
    {
        var doctorId = GetUserId();
        var result = await _slots.CreateBulkAsync(dto, doctorId);
        return Ok(result);
    }

    /// <summary>Bloquer un créneau — Médecin uniquement</summary>
    [HttpPut("{id}/block")]
    [Authorize(Roles = "Doctor")]
    public async Task<IActionResult> Block(int id)
    {
        var doctorId = GetUserId();
        await _slots.BlockAsync(id, doctorId);
        return NoContent();
    }

    /// <summary>Débloquer un créneau — Médecin uniquement</summary>
    [HttpPut("{id}/unblock")]
    [Authorize(Roles = "Doctor")]
    public async Task<IActionResult> Unblock(int id)
    {
        var doctorId = GetUserId();
        await _slots.UnblockAsync(id, doctorId);
        return NoContent();
    }

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}