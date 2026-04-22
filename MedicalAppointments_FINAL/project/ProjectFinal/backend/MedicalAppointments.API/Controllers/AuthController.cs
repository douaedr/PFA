using System.Security.Claims;
using MedicalAppointments.API.DTOs.Auth;
using MedicalAppointments.API.Infrastructure;
using MedicalAppointments.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MedicalAppointments.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IJwtService  _jwt;

    public AuthController(AppDbContext db, IJwtService jwt)
    {
        _db  = db;
        _jwt = jwt;
    }

    /// <summary>Inscription d'un patient</summary>
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        if (await _db.Users.AnyAsync(u => u.Email == dto.Email))
            return Conflict(new { message = "Cet email est déjà utilisé." });

        var user = new User
        {
            FullName     = dto.FullName,
            Email        = dto.Email,
            Phone        = dto.Phone,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role         = UserRole.Patient,
            IsRegistered = true
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return Ok(BuildResponse(user));
    }

    /// <summary>Connexion (tous rôles)</summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Email == dto.Email && u.IsRegistered);

        if (user is null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            return Unauthorized(new { message = "Email ou mot de passe invalide." });

        return Ok(BuildResponse(user));
    }

    /// <summary>Création d'un compte médecin ou secrétaire (admin uniquement)</summary>
    [HttpPost("create-staff")]
    [Authorize(Roles = "Doctor")]   // seul le médecin peut créer la secrétaire
    public async Task<IActionResult> CreateStaff([FromBody] CreateStaffDto dto)
    {
        if (!Enum.TryParse<UserRole>(dto.Role, out var role) ||
            role == UserRole.Patient)
            return BadRequest(new { message = "Rôle invalide. Valeurs : Doctor, Secretary." });

        if (await _db.Users.AnyAsync(u => u.Email == dto.Email))
            return Conflict(new { message = "Cet email est déjà utilisé." });

        var user = new User
        {
            FullName     = dto.FullName,
            Email        = dto.Email,
            Phone        = dto.Phone,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role         = role,
            IsRegistered = true
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return Ok(new { message = $"Compte {role} créé avec succès.", userId = user.Id });
    }

    /// <summary>Informations du compte connecté</summary>
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var id   = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await _db.Users.FindAsync(id);
        if (user is null) return NotFound();

        return Ok(new
        {
            user.Id,
            user.FullName,
            user.Email,
            user.Phone,
            user.Role,
            user.CancelCount,
            user.PenaltyUntil,
            UnderPenalty = user.PenaltyUntil.HasValue && user.PenaltyUntil > DateTime.UtcNow
        });
    }

    private AuthResponseDto BuildResponse(User user) =>
        new(_jwt.GenerateToken(user), user.Role.ToString(),
            user.FullName, DateTime.UtcNow.AddHours(8));
}
