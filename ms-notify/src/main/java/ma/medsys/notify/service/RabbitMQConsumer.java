package ma.medsys.notify.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.medsys.notify.dto.NotificationMessage;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * RabbitMQ event consumer.
 *
 * <p>Listens to appointment lifecycle events published by {@code ms-rdv} and
 * translates them into WebSocket notifications (and optional emails) via
 * {@link NotificationService}.</p>
 *
 * <p>All listener methods catch every exception and log it — an unhandled
 * exception would cause the message to be re-queued indefinitely.</p>
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class RabbitMQConsumer {

    private final NotificationService notificationService;

    // ── appointment.created ──────────────────────────────────────────────────

    /**
     * Handle an {@code appointment.created} event.
     *
     * <p>Expected payload fields:</p>
     * <ul>
     *   <li>{@code patientId}    — Long</li>
     *   <li>{@code medecinId}    — Long</li>
     *   <li>{@code medecinNom}   — String (optional, defaults to "le médecin")</li>
     *   <li>{@code patientNom}   — String (optional, defaults to "Patient")</li>
     *   <li>{@code dateHeure}    — ISO-8601 LocalDateTime string</li>
     *   <li>{@code patientEmail} — String (optional, omit to skip email)</li>
     * </ul>
     */
    @RabbitListener(queues = "appointment.created")
    public void handleAppointmentCreated(Map<String, Object> event) {
        log.info("Received appointment.created event: {}", event);
        try {
            Long patientId  = parseLong(event, "patientId");
            Long medecinId  = parseLong(event, "medecinId");
            String medecinNom   = stringOrDefault(event, "medecinNom", "le médecin");
            String patientNom   = stringOrDefault(event, "patientNom", "Patient");
            String dateHeureStr = stringOrDefault(event, "dateHeure", "");
            String patientEmail = stringOrDefault(event, "patientEmail", "");

            if (dateHeureStr.isBlank()) {
                log.error("appointment.created event missing dateHeure — skipping");
                return;
            }

            LocalDateTime dt = LocalDateTime.parse(dateHeureStr);

            // Notify patient with optional confirmation email
            notificationService.notifyRdvConfirmed(
                    patientId, medecinId, medecinNom, dt,
                    patientEmail.isBlank() ? null : patientEmail
            );

            // Notify doctor
            notificationService.notifyMedecinNewAppointment(medecinId, patientNom, dt);

        } catch (Exception e) {
            log.error("Error processing appointment.created event: {}", e.getMessage(), e);
        }
    }

    // ── appointment.confirmed ────────────────────────────────────────────────

    /**
     * Handle an {@code appointment.confirmed} event (doctor-side confirmation).
     *
     * <p>Expected payload fields: same as {@code appointment.created}.</p>
     */
    @RabbitListener(queues = "appointment.confirmed")
    public void handleAppointmentConfirmed(Map<String, Object> event) {
        log.info("Received appointment.confirmed event: {}", event);
        try {
            Long patientId      = parseLong(event, "patientId");
            Long medecinId      = parseLong(event, "medecinId");
            String medecinNom   = stringOrDefault(event, "medecinNom", "le médecin");
            String dateHeureStr = stringOrDefault(event, "dateHeure", "");
            String patientEmail = stringOrDefault(event, "patientEmail", "");

            if (dateHeureStr.isBlank()) {
                log.error("appointment.confirmed event missing dateHeure — skipping");
                return;
            }

            LocalDateTime dt = LocalDateTime.parse(dateHeureStr);
            notificationService.notifyRdvConfirmed(
                    patientId, medecinId, medecinNom, dt,
                    patientEmail.isBlank() ? null : patientEmail
            );

        } catch (Exception e) {
            log.error("Error processing appointment.confirmed event: {}", e.getMessage(), e);
        }
    }

    // ── appointment.cancelled ────────────────────────────────────────────────

    /**
     * Handle an {@code appointment.cancelled} event.
     *
     * <p>Expected payload fields:</p>
     * <ul>
     *   <li>{@code patientId}  — Long</li>
     *   <li>{@code medecinNom} — String (optional)</li>
     *   <li>{@code dateHeure}  — ISO-8601 LocalDateTime string (optional)</li>
     * </ul>
     */
    @RabbitListener(queues = "appointment.cancelled")
    public void handleAppointmentCancelled(Map<String, Object> event) {
        log.info("Received appointment.cancelled event: {}", event);
        try {
            Long patientId    = parseLong(event, "patientId");
            String medecinNom = stringOrDefault(event, "medecinNom", "le médecin");
            String dateHeureStr = stringOrDefault(event, "dateHeure", "");

            if (!dateHeureStr.isBlank()) {
                LocalDateTime dt = LocalDateTime.parse(dateHeureStr);
                notificationService.notifyRdvCancelled(patientId, medecinNom, dt);
            } else {
                // Minimal cancellation notification without date details
                NotificationMessage notif = NotificationMessage.builder()
                        .type("RDV_CANCELLED")
                        .title("Rendez-vous annulé")
                        .message("Votre rendez-vous a été annulé.")
                        .build();
                notificationService.sendToUser(patientId.toString(), notif);
            }

        } catch (Exception e) {
            log.error("Error processing appointment.cancelled event: {}", e.getMessage(), e);
        }
    }

    // ── appointment.noshow ───────────────────────────────────────────────────

    /**
     * Handle an {@code appointment.noshow} event.
     *
     * <p>When a patient accumulates 3 or more no-shows the director receives
     * an alert on {@code /topic/directeur}.</p>
     *
     * <p>Expected payload fields:</p>
     * <ul>
     *   <li>{@code patientId}   — Long</li>
     *   <li>{@code patientNom}  — String (optional)</li>
     *   <li>{@code noShowCount} — int (number of no-shows including this one)</li>
     * </ul>
     */
    @RabbitListener(queues = "appointment.noshow")
    public void handleNoShow(Map<String, Object> event) {
        log.info("Received appointment.noshow event: {}", event);
        try {
            String patientNom  = stringOrDefault(event, "patientNom", "Patient");
            int noShowCount    = Integer.parseInt(
                    stringOrDefault(event, "noShowCount", "1"));

            // Always notify the patient
            Long patientId = parseLong(event, "patientId");
            NotificationMessage patientNotif = NotificationMessage.builder()
                    .type("NOSHOW_REGISTERED")
                    .title("Absence enregistrée")
                    .message("Une absence a été enregistrée pour votre rendez-vous. "
                             + "Veuillez contacter l'hôpital si vous pensez qu'il s'agit d'une erreur.")
                    .build();
            notificationService.sendToUser(patientId.toString(), patientNotif);

            // Alert director when threshold is reached
            if (noShowCount >= 3) {
                notificationService.alertDirecteur(
                        "Alerte : Le patient " + patientNom
                        + " a " + noShowCount + " absences non justifiées.",
                        "NOSHOW_ALERT"
                );
            }

        } catch (Exception e) {
            log.error("Error processing appointment.noshow event: {}", e.getMessage(), e);
        }
    }

    // ── Utilities ────────────────────────────────────────────────────────────

    private Long parseLong(Map<String, Object> event, String key) {
        Object value = event.get(key);
        if (value == null) {
            throw new IllegalArgumentException("Missing required field: " + key);
        }
        return Long.valueOf(value.toString());
    }

    private String stringOrDefault(Map<String, Object> event, String key, String defaultValue) {
        Object value = event.get(key);
        return value != null ? value.toString() : defaultValue;
    }
}
