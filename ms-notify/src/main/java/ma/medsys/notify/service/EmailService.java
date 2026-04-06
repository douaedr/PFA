package ma.medsys.notify.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.medsys.notify.dto.EmailRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Map;

/**
 * Email delivery service.
 *
 * <p>All send methods swallow exceptions and log the error — a failed email
 * must never crash the notification pipeline or the calling thread.</p>
 *
 * <p>HTML emails are rendered via Thymeleaf using templates stored in
 * {@code src/main/resources/templates/}. A plain-text fallback is always
 * provided for clients that cannot render HTML.</p>
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class EmailService {

    private static final DateTimeFormatter DISPLAY_FORMAT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm");
    private static final DateTimeFormatter LONG_DATE_FORMAT =
            DateTimeFormatter.ofPattern("EEEE dd MMMM yyyy", Locale.FRENCH);
    private static final DateTimeFormatter TIME_FORMAT =
            DateTimeFormatter.ofPattern("HH:mm");

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${spring.mail.username}")
    private String fromEmail;

    // ── Domain-specific send helpers ─────────────────────────────────────────

    /**
     * Send an HTML appointment-confirmation email to a patient.
     *
     * @param to         recipient email address
     * @param medecinNom full name of the doctor
     * @param dateHeure  confirmed appointment date and time
     */
    public void sendRdvConfirmation(String to, String medecinNom, LocalDateTime dateHeure) {
        try {
            Context context = new Context();
            context.setVariable("medecinNom", medecinNom);
            context.setVariable("dateHeure", dateHeure.format(DISPLAY_FORMAT));
            context.setVariable("date", dateHeure.toLocalDate().format(LONG_DATE_FORMAT));
            context.setVariable("heure", dateHeure.toLocalTime().format(TIME_FORMAT));

            String html = templateEngine.process("rdv-confirmation", context);
            sendHtmlEmail(to, "Confirmation de votre rendez-vous — MedSys", html);
        } catch (Exception e) {
            log.error("Failed to send RDV confirmation email to {}: {}", to, e.getMessage());
        }
    }

    /**
     * Send an HTML 24-hour reminder email to a patient.
     *
     * @param to         recipient email address
     * @param medecinNom full name of the doctor
     * @param dateHeure  appointment date and time
     */
    public void sendRdvReminder(String to, String medecinNom, LocalDateTime dateHeure) {
        try {
            Context context = new Context();
            context.setVariable("medecinNom", medecinNom);
            context.setVariable("dateHeure", dateHeure.format(DISPLAY_FORMAT));
            context.setVariable("date", dateHeure.toLocalDate().format(LONG_DATE_FORMAT));
            context.setVariable("heure", dateHeure.toLocalTime().format(TIME_FORMAT));

            String html = templateEngine.process("rdv-reminder", context);
            sendHtmlEmail(to, "Rappel : Rendez-vous demain — MedSys", html);
        } catch (Exception e) {
            log.error("Failed to send RDV reminder email to {}: {}", to, e.getMessage());
        }
    }

    /**
     * Send a plain-text email. Used as fallback or for simple system messages.
     *
     * @param to      recipient email address
     * @param subject email subject
     * @param text    plain-text body
     */
    public void sendSimpleEmail(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
            log.info("Plain-text email sent to {}", to);
        } catch (Exception e) {
            log.error("Failed to send plain-text email to {}: {}", to, e.getMessage());
        }
    }

    /**
     * Generic send method driven by an {@link EmailRequest} DTO.
     * Renders a Thymeleaf template when {@code templateName} is specified,
     * otherwise falls back to {@code plainText}.
     *
     * @param request fully-populated email request
     */
    public void send(EmailRequest request) {
        if (request.getTemplateName() != null && !request.getTemplateName().isBlank()) {
            try {
                Context context = new Context();
                if (request.getVariables() != null) {
                    request.getVariables().forEach(context::setVariable);
                }
                String html = templateEngine.process(request.getTemplateName(), context);
                sendHtmlEmail(request.getTo(), request.getSubject(), html);
            } catch (Exception e) {
                log.error("Failed to render/send template email [template={}] to {}: {}",
                        request.getTemplateName(), request.getTo(), e.getMessage());
                // Fallback to plain text if template rendering fails
                if (request.getPlainText() != null) {
                    sendSimpleEmail(request.getTo(), request.getSubject(), request.getPlainText());
                }
            }
        } else if (request.getPlainText() != null && !request.getPlainText().isBlank()) {
            sendSimpleEmail(request.getTo(), request.getSubject(), request.getPlainText());
        } else {
            log.warn("EmailRequest for {} has neither templateName nor plainText — skipping", request.getTo());
        }
    }

    // ── Internal helpers ─────────────────────────────────────────────────────

    /**
     * Construct and send a multipart HTML MIME email.
     *
     * @param to          recipient address
     * @param subject     email subject
     * @param htmlContent rendered HTML body
     * @throws MessagingException if the SMTP transport fails
     */
    private void sendHtmlEmail(String to, String subject, String htmlContent)
            throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(fromEmail);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);
        mailSender.send(message);
        log.info("HTML email sent to {}", to);
    }
}
