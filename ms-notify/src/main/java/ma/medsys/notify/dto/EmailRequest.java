package ma.medsys.notify.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Request object used to trigger an email send via
 * {@link ma.medsys.notify.controller.NotificationController} or internally
 * within {@link ma.medsys.notify.service.EmailService}.
 *
 * <p>If {@code templateName} is provided the email is rendered from the
 * corresponding Thymeleaf template under {@code src/main/resources/templates/}.
 * Otherwise the {@code plainText} body is used as a fallback.</p>
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EmailRequest {

    /** Recipient email address. */
    private String to;

    /** Email subject line. */
    private String subject;

    /**
     * Name of the Thymeleaf template file (without the {@code .html} suffix).
     * Example: {@code "rdv-confirmation"}.
     */
    private String templateName;

    /**
     * Template variables injected into the Thymeleaf context.
     * Keys must match the variable names used in the template.
     */
    private Map<String, Object> variables;

    /**
     * Plain-text body used when {@code templateName} is {@code null} or blank.
     */
    private String plainText;
}
