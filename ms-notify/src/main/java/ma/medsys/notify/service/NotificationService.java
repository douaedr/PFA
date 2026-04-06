package ma.medsys.notify.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.medsys.notify.dto.NotificationMessage;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.UUID;

/**
 * Core notification dispatcher.
 *
 * <p>All outbound WebSocket messages are sent through this service. It assigns
 * a unique ID and timestamp to every notification before dispatch, and
 * simultaneously delivers to both the per-user queue (for targeted delivery)
 * and a per-user topic (for multi-tab / multi-device support).</p>
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationService {

    private static final DateTimeFormatter DISPLAY_FORMAT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm");

    private final SimpMessagingTemplate messagingTemplate;
    private final EmailService emailService;

    // ── Core dispatch ────────────────────────────────────────────────────────

    /**
     * Send a real-time WebSocket notification to a specific user.
     *
     * <p>Delivery uses two channels:</p>
     * <ol>
     *   <li>{@code /user/{userId}/queue/notifications} — STOMP user destination</li>
     *   <li>{@code /topic/user/{userId}} — topic broadcast (multi-tab support)</li>
     * </ol>
     *
     * @param userId       target user's ID (as stored in JWT claims)
     * @param notification notification payload (id and timestamp will be overwritten)
     */
    public void sendToUser(String userId, NotificationMessage notification) {
        notification.setId(UUID.randomUUID().toString());
        notification.setTimestamp(LocalDateTime.now());
        notification.setRead(false);
        notification.setUserId(userId);

        log.info("Dispatching notification [type={}] to user [{}]", notification.getType(), userId);

        // Targeted per-user queue (requires the client to be connected with the matching principal)
        messagingTemplate.convertAndSendToUser(userId, "/queue/notifications", notification);

        // Topic broadcast so multiple browser tabs receive the notification
        messagingTemplate.convertAndSend("/topic/user/" + userId, notification);
    }

    // ── Domain-specific helpers ──────────────────────────────────────────────

    /**
     * Notify a patient that their appointment has been confirmed and optionally
     * send a confirmation email.
     *
     * @param patientId    patient's numeric user ID
     * @param medecinId    doctor's numeric user ID (unused in the notification itself
     *                     but stored in the extra data map)
     * @param medecinNom   full name of the doctor
     * @param dateHeure    date and time of the appointment
     * @param patientEmail patient email address, or {@code null} to skip email
     */
    public void notifyRdvConfirmed(Long patientId, Long medecinId, String medecinNom,
                                   LocalDateTime dateHeure, String patientEmail) {
        NotificationMessage notif = NotificationMessage.builder()
                .type("RDV_CONFIRMED")
                .title("Rendez-vous confirmé")
                .message("Votre rendez-vous avec " + medecinNom + " est confirmé pour le "
                         + dateHeure.format(DISPLAY_FORMAT))
                .data(Map.of(
                        "medecinId", medecinId.toString(),
                        "medecinNom", medecinNom,
                        "dateHeure", dateHeure.toString()
                ))
                .build();

        sendToUser(patientId.toString(), notif);

        if (patientEmail != null && !patientEmail.isBlank()) {
            emailService.sendRdvConfirmation(patientEmail, medecinNom, dateHeure);
        }
    }

    /**
     * Notify a patient that a previously waitlisted slot is now available.
     * The patient has a 2-hour window to confirm before the slot is released.
     *
     * @param patientId  patient's numeric user ID
     * @param medecinNom full name of the doctor
     * @param dateHeure  date and time of the available slot
     */
    public void notifyWaitlistSlotAvailable(Long patientId, String medecinNom,
                                             LocalDateTime dateHeure) {
        NotificationMessage notif = NotificationMessage.builder()
                .type("WAITLIST_AVAILABLE")
                .title("Créneau disponible !")
                .message("Un créneau avec " + medecinNom + " est maintenant disponible le "
                         + dateHeure.format(DISPLAY_FORMAT)
                         + ". Confirmez avant 2 heures.")
                .data(Map.of(
                        "medecinNom", medecinNom,
                        "dateHeure", dateHeure.toString()
                ))
                .build();

        sendToUser(patientId.toString(), notif);
    }

    /**
     * Notify a patient that their appointment has been cancelled.
     *
     * @param patientId  patient's numeric user ID
     * @param medecinNom full name of the doctor (for context in the message)
     * @param dateHeure  original date and time of the cancelled appointment
     */
    public void notifyRdvCancelled(Long patientId, String medecinNom, LocalDateTime dateHeure) {
        NotificationMessage notif = NotificationMessage.builder()
                .type("RDV_CANCELLED")
                .title("Rendez-vous annulé")
                .message("Votre rendez-vous avec " + medecinNom + " prévu le "
                         + dateHeure.format(DISPLAY_FORMAT) + " a été annulé.")
                .data(Map.of(
                        "medecinNom", medecinNom,
                        "dateHeure", dateHeure.toString()
                ))
                .build();

        sendToUser(patientId.toString(), notif);
    }

    /**
     * Send a 24-hour reminder to a patient and deliver a reminder email.
     *
     * @param patientId    patient's numeric user ID
     * @param medecinNom   full name of the doctor
     * @param dateHeure    appointment date and time
     * @param patientEmail patient email address, or {@code null} to skip email
     */
    public void notifyRdvReminder(Long patientId, String medecinNom,
                                   LocalDateTime dateHeure, String patientEmail) {
        NotificationMessage notif = NotificationMessage.builder()
                .type("RDV_REMINDER")
                .title("Rappel : rendez-vous demain")
                .message("Rappel : vous avez un rendez-vous avec " + medecinNom + " demain le "
                         + dateHeure.format(DISPLAY_FORMAT))
                .data(Map.of(
                        "medecinNom", medecinNom,
                        "dateHeure", dateHeure.toString()
                ))
                .build();

        sendToUser(patientId.toString(), notif);

        if (patientEmail != null && !patientEmail.isBlank()) {
            emailService.sendRdvReminder(patientEmail, medecinNom, dateHeure);
        }
    }

    /**
     * Notify a doctor that a new appointment has been booked with them.
     *
     * @param medecinId  doctor's numeric user ID
     * @param patientNom full name of the patient
     * @param dateHeure  appointment date and time
     */
    public void notifyMedecinNewAppointment(Long medecinId, String patientNom,
                                             LocalDateTime dateHeure) {
        NotificationMessage notif = NotificationMessage.builder()
                .type("NEW_APPOINTMENT")
                .title("Nouveau rendez-vous")
                .message("Nouveau RDV avec " + patientNom + " le "
                         + dateHeure.format(DISPLAY_FORMAT))
                .data(Map.of(
                        "patientNom", patientNom,
                        "dateHeure", dateHeure.toString()
                ))
                .build();

        sendToUser(medecinId.toString(), notif);
    }

    /**
     * Notify a patient that a medical result is available.
     *
     * @param patientId   patient's numeric user ID
     * @param resultType  type of result (e.g. "Analyse sanguine", "Imagerie")
     * @param dossierId   ID of the medical dossier containing the result
     */
    public void notifyResultReady(Long patientId, String resultType, Long dossierId) {
        NotificationMessage notif = NotificationMessage.builder()
                .type("RESULT_READY")
                .title("Résultat disponible")
                .message("Votre résultat de " + resultType + " est disponible dans votre dossier médical.")
                .data(Map.of(
                        "resultType", resultType,
                        "dossierId", dossierId.toString()
                ))
                .build();

        sendToUser(patientId.toString(), notif);
    }

    /**
     * Broadcast an alert to all connected director sessions via
     * {@code /topic/directeur}.
     *
     * @param message human-readable alert text
     * @param type    alert type discriminator (e.g. {@code "NOSHOW_ALERT"})
     */
    public void alertDirecteur(String message, String type) {
        NotificationMessage notif = NotificationMessage.builder()
                .type(type)
                .title("Alerte système")
                .message(message)
                .userId("DIRECTEUR")
                .id(UUID.randomUUID().toString())
                .timestamp(LocalDateTime.now())
                .read(false)
                .build();

        log.warn("Director alert [type={}]: {}", type, message);
        messagingTemplate.convertAndSend("/topic/directeur", notif);
    }
}
