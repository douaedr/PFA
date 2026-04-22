using MedicalAppointments.API.Infrastructure;
using MedicalAppointments.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MedicalAppointments.API.Controllers;

[ApiController]
[Route("api/services")]
public class ServicesController : ControllerBase
{
    private readonly AppDbContext _db;

    public ServicesController(AppDbContext db) => _db = db;

    /// <summary>Liste tous les services disponibles — accessible à tous</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var services = await _db.Services
            .OrderBy(s => s.Name)
            .Select(s => new
            {
                s.Id,
                s.Name,
                s.Description,
                s.Icon
            })
            .ToListAsync();

        return Ok(services);
    }

    /// <summary>Médecins d'un service donné — accessible à tous</summary>
    [HttpGet("{serviceId}/doctors")]
    public async Task<IActionResult> GetDoctors(int serviceId)
    {
        var serviceExists = await _db.Services.AnyAsync(s => s.Id == serviceId);
        if (!serviceExists)
            return NotFound(new { message = "Service introuvable." });

        var doctors = await _db.DoctorServices
            .Where(ds => ds.ServiceId == serviceId)
            .Include(ds => ds.Doctor)
            .Select(ds => new
            {
                ds.Doctor.Id,
                ds.Doctor.FullName,
                ds.Doctor.Email,
                ds.Doctor.Phone
            })
            .ToListAsync();

        return Ok(doctors);
    }

    /// <summary>Associer un médecin à des services — Médecin uniquement</summary>
    [HttpPost("assign")]
    [Authorize(Roles = "Doctor")]
    public async Task<IActionResult> AssignServices([FromBody] AssignServicesDto dto)
    {
        // Supprimer les anciennes associations
        var existing = _db.DoctorServices.Where(ds => ds.DoctorId == dto.DoctorId);
        _db.DoctorServices.RemoveRange(existing);

        // Vérifier que les services existent
        var validIds = await _db.Services
            .Where(s => dto.ServiceIds.Contains(s.Id))
            .Select(s => s.Id)
            .ToListAsync();

        foreach (var sid in validIds)
        {
            _db.DoctorServices.Add(new DoctorService
            {
                DoctorId  = dto.DoctorId,
                ServiceId = sid
            });
        }

        await _db.SaveChangesAsync();
        return Ok(new { message = "Services mis à jour avec succès." });
    }

    /// <summary>Services du médecin connecté — Médecin uniquement</summary>
    [HttpGet("my-services")]
    [Authorize(Roles = "Doctor")]
    public async Task<IActionResult> GetMyServices()
    {
        var doctorId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

        var services = await _db.DoctorServices
            .Where(ds => ds.DoctorId == doctorId)
            .Include(ds => ds.Service)
            .Select(ds => new
            {
                ds.Service.Id,
                ds.Service.Name,
                ds.Service.Description,
                ds.Service.Icon
            })
            .ToListAsync();

        return Ok(services);
    }
}

public record AssignServicesDto(int DoctorId, List<int> ServiceIds);
