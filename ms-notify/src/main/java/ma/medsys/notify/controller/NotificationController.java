package ma.medsys.notify.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.medsys.notify.dto.EmailRequest;
import ma.medsys.notify.dto.NotificationMessage;
import ma.medsys.notify.service.EmailService;
import ma.medsys.notify.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

/**
 * REST API for ms-notify.
 *
 * <p>Provides endpoints for:</p>
 * <ul>
 *   <li>Sending ad-hoc WebSocket notifications (called by other microservices)</li>
 *   <li>Sending ad-hoc emails</li>
 *   <li>Broadcasting director alerts</li>
 *   <li>Connectivity test</li>
 * </ul>
 *
 * <p>All endpoints are reachable without authentication (see {@link ma.medsys.notify.config.SecurityConfig}).
 * In production, these routes should be protected at the network level or behind
 * an API gateway that only allows inbound calls from trusted microservices.</p>
 */
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final NotificationService notificationService;
    private final EmailService emailService;
    private final SimpMessagingTemplate messagingTemplate;

    // ── WebSocket dispatch ───────────────────────────────────────────────────

    /**
     * Send a WebSocket notification to a specific user.
     *
     * <p>Caller must set {@code userId} in the request body. The service
     * overwrites {@code id} and {@code timestamp} before delivery.</p>
     *
     * @param notification notification payload
     * @return 200 OK on success
     */
    @PostMapping("/send")
    public ResponseEntity<Void> sendNotification(@RequestBody NotificationMessage notification) {
        if (notification.getUserId() == null || notification.getUserId().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        notificationService.sendToUser(notification.getUserId(), notification);
        return ResponseEntity.ok().build();
    }

    /**
     * Broadcast a notification to all connected director sessions.
     *
     * @param notification notification payload (userId is ignored; delivery is via /topic/directeur)
     * @return 200 OK on success
     */
    @PostMapping("/director/alert")
    public ResponseEntity<Void> alertDirecteur(@RequestBody NotificationMessage notification) {
        notificationService.alertDirecteur(notification.getMessage(), notification.getType());
        return ResponseEntity.ok().build();
    }

    // ── Email dispatch ───────────────────────────────────────────────────────

    /**
     * Send an email using the generic {@link EmailRequest} DTO.
     * Supports both Thymeleaf-template and plain-text modes.
     *
     * @param request email request
     * @return 200 OK (send is fire-and-forget; errors are logged internally)
     */
    @PostMapping("/email/send")
    public ResponseEntity<Void> sendEmail(@RequestBody EmailRequest request) {
        emailService.send(request);
        return ResponseEntity.ok().build();
    }

    // ── Convenience / domain shortcuts ──────────────────────────────────────

    /**
     * Trigger an RDV-confirmed notification and email for a patient.
     *
     * <p>Query parameters:</p>
     * <ul>
     *   <li>{@code patientId}    — required</li>
     *   <li>{@code medecinId}    — required</li>
     *   <li>{@code medecinNom}   — required</li>
     *   <li>{@code dateHeure}    — ISO-8601 (e.g. {@code 2026-04-10T09:30:00})</li>
     *   <li>{@code patientEmail} — optional</li>
     * </ul>
     */
    @PostMapping("/rdv/confirmed")
    public ResponseEntity<Void> rdvConfirmed(
            @RequestParam Long patientId,
            @RequestParam Long medecinId,
            @RequestParam String medecinNom,
            @RequestParam String dateHeure,
            @RequestParam(required = false) String patientEmail) {

        LocalDateTime dt = LocalDateTime.parse(dateHeure);
        notificationService.notifyRdvConfirmed(patientId, medecinId, medecinNom, dt, patientEmail);
        return ResponseEntity.ok().build();
    }

    /**
     * Trigger a 24-hour RDV reminder for a patient.
     */
    @PostMapping("/rdv/reminder")
    public ResponseEntity<Void> rdvReminder(
            @RequestParam Long patientId,
            @RequestParam String medecinNom,
            @RequestParam String dateHeure,
            @RequestParam(required = false) String patientEmail) {

        LocalDateTime dt = LocalDateTime.parse(dateHeure);
        notificationService.notifyRdvReminder(patientId, medecinNom, dt, patientEmail);
        return ResponseEntity.ok().build();
    }

    /**
     * Trigger an RDV-cancelled notification for a patient.
     */
    @PostMapping("/rdv/cancelled")
    public ResponseEntity<Void> rdvCancelled(
            @RequestParam Long patientId,
            @RequestParam String medecinNom,
            @RequestParam String dateHeure) {

        LocalDateTime dt = LocalDateTime.parse(dateHeure);
        notificationService.notifyRdvCancelled(patientId, medecinNom, dt);
        return ResponseEntity.ok().build();
    }

    // ── Test / diagnostics ───────────────────────────────────────────────────

    /**
     * Connectivity test — sends a TEST notification to the given user.
     *
     * @param userId target user ID
     * @return plain-text confirmation message
     */
    @GetMapping("/test/{userId}")
    public ResponseEntity<String> test(@PathVariable String userId) {
        log.info("Test notification requested for user {}", userId);
        notificationService.sendToUser(userId, NotificationMessage.builder()
                .type("TEST")
                .title("Test notification")
                .message("Connexion WebSocket opérationnelle !")
                .userId(userId)
                .build());
        return ResponseEntity.ok("Notification sent to user: " + userId);
    }

    /**
     * Health-check endpoint.
     *
     * @return 200 OK with service name and current timestamp
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("ms-notify UP — " + LocalDateTime.now());
    }
}
