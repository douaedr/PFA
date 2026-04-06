package ma.medsys.notify.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Payload sent over WebSocket and stored transiently in memory.
 *
 * <p>Notification types used across the system:</p>
 * <ul>
 *   <li>{@code RDV_CONFIRMED}       — appointment booked successfully</li>
 *   <li>{@code RDV_REMINDER}        — 24-hour reminder before appointment</li>
 *   <li>{@code RDV_CANCELLED}       — appointment cancelled</li>
 *   <li>{@code WAITLIST_AVAILABLE}  — a slot opened for a waitlisted patient</li>
 *   <li>{@code RESULT_READY}        — medical result is available</li>
 *   <li>{@code MESSAGE_RECEIVED}    — new in-app message</li>
 *   <li>{@code NEW_APPOINTMENT}     — doctor receives new booking</li>
 *   <li>{@code NOSHOW_ALERT}        — director alert for repeated no-shows</li>
 *   <li>{@code TEST}                — connectivity test</li>
 * </ul>
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class NotificationMessage {

    /** Auto-generated UUID assigned by {@link ma.medsys.notify.service.NotificationService}. */
    private String id;

    /**
     * Notification type discriminator. Clients switch on this field to render
     * appropriate icons/colours in the UI.
     */
    private String type;

    /** Short display title (≤ 80 chars). */
    private String title;

    /** Human-readable body text. */
    private String message;

    /** Target user identifier — matches the user ID stored in JWT claims. */
    private String userId;

    /** Whether the user has acknowledged this notification. Defaults to {@code false}. */
    @Builder.Default
    private boolean read = false;

    /** Server-side timestamp set when the notification is dispatched. */
    private LocalDateTime timestamp;

    /**
     * Arbitrary extra data attached to the notification (e.g. appointmentId,
     * medecinNom, dateHeure). Clients may deep-link into the relevant screen
     * using these values.
     */
    private Map<String, Object> data;
}
