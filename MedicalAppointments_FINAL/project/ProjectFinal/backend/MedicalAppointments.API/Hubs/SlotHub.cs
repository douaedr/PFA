using Microsoft.AspNetCore.SignalR;

namespace MedicalAppointments.API.Hubs;

/// <summary>
/// Hub SignalR pour les mises à jour en temps réel des créneaux.
///
/// Événements émis par le serveur :
///   - SlotStatusChanged  { slotId, status, isClickable }
///   - SlotAdded          { id, startTime, endTime, status, isClickable }
///
/// Méthodes appelables par les clients :
///   - JoinDoctorGroup(doctorId)   → rejoindre le groupe d'un médecin
///   - LeaveDoctorGroup(doctorId)  → quitter le groupe
/// </summary>
public class SlotHub : Hub
{
    private readonly ILogger<SlotHub> _logger;

    public SlotHub(ILogger<SlotHub> logger) => _logger = logger;

    public async Task JoinDoctorGroup(string doctorId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"doctor_{doctorId}");
        _logger.LogInformation(
            "Client {ConnectionId} a rejoint le groupe doctor_{DoctorId}",
            Context.ConnectionId, doctorId);
    }

    public async Task LeaveDoctorGroup(string doctorId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"doctor_{doctorId}");
        _logger.LogInformation(
            "Client {ConnectionId} a quitté le groupe doctor_{DoctorId}",
            Context.ConnectionId, doctorId);
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("Client connecté : {ConnectionId}", Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("Client déconnecté : {ConnectionId}", Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }
}
