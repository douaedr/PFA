using MedicalAppointments.API.DTOs.Slot;
using MedicalAppointments.API.Hubs;
using MedicalAppointments.API.Infrastructure;
using MedicalAppointments.API.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace MedicalAppointments.API.Services;

public interface ISlotService
{
    Task<TimeSlotResponseDto> CreateAsync(CreateSlotDto dto, int doctorId);
    Task<IEnumerable<TimeSlotResponseDto>> CreateBulkAsync(CreateBulkSlotsDto dto, int doctorId);
    Task BlockAsync(int slotId, int doctorId);
    Task UnblockAsync(int slotId, int doctorId);
    // ✅ FIX Bug 3 : GetWeekSlotsAsync retourne maintenant les infos patient
    Task<IEnumerable<TimeSlotResponseDto>> GetWeekSlotsAsync(int doctorId, DateOnly weekStart);
    Task<bool> IsWeekFullAsync(int doctorId, DateOnly weekStart);

    // ✅ FIX Bug 1 : nouvelles méthodes pour créneaux hospitaliers
    Task<IEnumerable<HospitalSlotResponseDto>> GetHospitalSlotsAsync(int serviceId, DateOnly weekStart);
    Task<bool> IsHospitalWeekFullAsync(int serviceId, DateOnly weekStart);
}

public class SlotService : ISlotService
{
    private readonly AppDbContext _db;
    private readonly IHubContext<SlotHub> _hub;
    private readonly ILogger<SlotService> _logger;

    public SlotService(
        AppDbContext db,
        IHubContext<SlotHub> hub,
        ILogger<SlotService> logger)
    {
        _db = db;
        _hub = hub;
        _logger = logger;
    }

    public async Task<TimeSlotResponseDto> CreateAsync(CreateSlotDto dto, int doctorId)
    {
        if (dto.EndTime <= dto.StartTime)
            throw new ArgumentException("L'heure de fin doit être après l'heure de début.");

        if (dto.StartTime < DateTime.UtcNow)
            throw new ArgumentException("Impossible de créer un créneau dans le passé.");

        await CheckOverlapAsync(doctorId, dto.StartTime, dto.EndTime);

        var slot = new TimeSlot
        {
            DoctorId = doctorId,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            Status = SlotStatus.Available
        };

        _db.TimeSlots.Add(slot);

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = doctorId,
            Action = "CREATE_SLOT",
            EntityType = "TimeSlot",
            EntityId = 0,
            Detail = $"{dto.StartTime:dd/MM/yyyy HH:mm} – {dto.EndTime:HH:mm}"
        });

        await _db.SaveChangesAsync();

        await _hub.Clients.All.SendAsync("SlotAdded", MapToDto(slot, null));

        return MapToDto(slot, null);
    }

    public async Task<IEnumerable<TimeSlotResponseDto>> CreateBulkAsync(
        CreateBulkSlotsDto dto, int doctorId)
    {
        var created = new List<TimeSlot>();
        var current = dto.WeekStartDate.ToDateTime(TimeOnly.MinValue);
        var weekEnd = current.AddDays(7);

        while (current < weekEnd)
        {
            if (dto.WorkDays.Contains(current.DayOfWeek))
            {
                var start = current.Date
                    .AddHours(dto.SlotStartTime.Hour)
                    .AddMinutes(dto.SlotStartTime.Minute);
                var dayEnd = current.Date
                    .AddHours(dto.SlotEndTime.Hour)
                    .AddMinutes(dto.SlotEndTime.Minute);

                while (start.AddMinutes(dto.SlotDurationMinutes) <= dayEnd)
                {
                    var end = start.AddMinutes(dto.SlotDurationMinutes);

                    bool overlap = await _db.TimeSlots.AnyAsync(t =>
                        t.DoctorId == doctorId &&
                        t.Status != SlotStatus.Cancelled &&
                        t.StartTime < end &&
                        t.EndTime > start);

                    if (!overlap)
                    {
                        var slot = new TimeSlot
                        {
                            DoctorId = doctorId,
                            StartTime = start,
                            EndTime = end,
                            Status = SlotStatus.Available
                        };
                        _db.TimeSlots.Add(slot);
                        created.Add(slot);
                    }

                    start = end;
                }
            }
            current = current.AddDays(1);
        }

        await _db.SaveChangesAsync();

        foreach (var slot in created)
            await _hub.Clients.All.SendAsync("SlotAdded", MapToDto(slot, null));

        return created.Select(s => MapToDto(s, null));
    }

    public async Task BlockAsync(int slotId, int doctorId)
    {
        var slot = await _db.TimeSlots
            .FirstOrDefaultAsync(t => t.Id == slotId && t.DoctorId == doctorId)
            ?? throw new KeyNotFoundException("Créneau introuvable.");

        if (slot.Status == SlotStatus.Reserved)
            throw new InvalidOperationException("Impossible de bloquer un créneau réservé.");

        slot.Status = SlotStatus.Blocked;
        slot.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        await _hub.Clients.All.SendAsync("SlotStatusChanged", new
        {
            slotId = slot.Id,
            status = "Blocked",
            isClickable = false
        });
    }

    public async Task UnblockAsync(int slotId, int doctorId)
    {
        var slot = await _db.TimeSlots
            .FirstOrDefaultAsync(t => t.Id == slotId && t.DoctorId == doctorId)
            ?? throw new KeyNotFoundException("Créneau introuvable.");

        if (slot.Status != SlotStatus.Blocked)
            throw new InvalidOperationException("Ce créneau n'est pas bloqué.");

        slot.Status = SlotStatus.Available;
        slot.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        await _hub.Clients.All.SendAsync("SlotStatusChanged", new
        {
            slotId = slot.Id,
            status = "Available",
            isClickable = true
        });
    }

    // ✅ FIX Bug 3 : Join avec Appointments pour récupérer PatientName, PatientEmail, AppointmentId
    public async Task<IEnumerable<TimeSlotResponseDto>> GetWeekSlotsAsync(
        int doctorId, DateOnly weekStart)
    {
        var start = weekStart.ToDateTime(TimeOnly.MinValue);
        var end = start.AddDays(7);

        var slots = await _db.TimeSlots
            .Where(t => t.DoctorId == doctorId
                     && t.StartTime >= start
                     && t.StartTime < end)
            .Include(t => t.Appointment)
                .ThenInclude(a => a!.Patient)
            .OrderBy(t => t.StartTime)
            .ToListAsync();

        return slots.Select(t => MapToDto(t, t.Appointment));
    }

    public async Task<bool> IsWeekFullAsync(int doctorId, DateOnly weekStart)
    {
        var start = weekStart.ToDateTime(TimeOnly.MinValue);
        var end = start.AddDays(7);

        return !await _db.TimeSlots.AnyAsync(t =>
            t.DoctorId == doctorId &&
            t.StartTime >= start &&
            t.StartTime < end &&
            t.Status == SlotStatus.Available);
    }

    // ✅ FIX Bug 1 : Créneaux hospitaliers filtrés par ServiceId (DoctorId = NULL)
    public async Task<IEnumerable<HospitalSlotResponseDto>> GetHospitalSlotsAsync(
        int serviceId, DateOnly weekStart)
    {
        var start = weekStart.ToDateTime(TimeOnly.MinValue);
        var end = start.AddDays(7);

        var slots = await _db.TimeSlots
            .Where(t => t.DoctorId == null
                     && t.ServiceId == serviceId
                     && t.StartTime >= start
                     && t.StartTime < end)
            .Include(t => t.Service)
            .OrderBy(t => t.StartTime)
            .ToListAsync();

        return slots.Select(t => new HospitalSlotResponseDto(
            t.Id,
            t.StartTime,
            t.EndTime,
            t.Status.ToString(),
            t.Status == SlotStatus.Available,
            t.ServiceId ?? 0,
            t.Service?.Name ?? ""
        ));
    }

    public async Task<bool> IsHospitalWeekFullAsync(int serviceId, DateOnly weekStart)
    {
        var start = weekStart.ToDateTime(TimeOnly.MinValue);
        var end = start.AddDays(7);

        return !await _db.TimeSlots.AnyAsync(t =>
            t.DoctorId == null &&
            t.ServiceId == serviceId &&
            t.StartTime >= start &&
            t.StartTime < end &&
            t.Status == SlotStatus.Available);
    }

    // ─── Helpers privés ────────────────────────────────────────────────────
    private async Task CheckOverlapAsync(int doctorId, DateTime start, DateTime end)
    {
        bool overlap = await _db.TimeSlots.AnyAsync(t =>
            t.DoctorId == doctorId &&
            t.Status != SlotStatus.Cancelled &&
            t.StartTime < end &&
            t.EndTime > start);

        if (overlap)
            throw new InvalidOperationException("Ce créneau chevauche un créneau existant.");
    }

    // ✅ FIX Bug 3 : MapToDto inclut les infos patient si le créneau est réservé
    private static TimeSlotResponseDto MapToDto(TimeSlot t, Appointment? appt) =>
        new(
            t.Id,
            t.StartTime,
            t.EndTime,
            t.Status.ToString(),
            t.Status == SlotStatus.Available,
            appt?.Patient?.FullName,
            appt?.Patient?.Email,
            appt?.Id
        );
}