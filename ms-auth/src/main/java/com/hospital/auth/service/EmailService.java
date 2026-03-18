package com.hospital.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:medsys@hospital.ma}")
    private String fromEmail;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public void sendPasswordResetEmail(String to, String nom, String token) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("🏥 MedSys — Réinitialisation de votre mot de passe");
            message.setText(
                "Bonjour " + nom + ",\n\n" +
                "Vous avez demandé la réinitialisation de votre mot de passe.\n\n" +
                "Cliquez sur le lien ci-dessous (valable 1 heure) :\n" +
                frontendUrl + "/reset-password?token=" + token + "\n\n" +
                "Si vous n'avez pas fait cette demande, ignorez cet email.\n\n" +
                "Cordialement,\nL'équipe MedSys"
            );
            mailSender.send(message);
            log.info("Email de réinitialisation envoyé à {}", to);
        } catch (Exception e) {
            log.error("Erreur envoi email à {} : {}", to, e.getMessage());
            // On ne bloque pas le flux si l'email échoue en dev
        }
    }

    public void sendAccountCreatedEmail(String to, String nom, String tempPassword) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("🏥 MedSys — Vos identifiants de connexion");
            message.setText(
                "Bonjour Dr. " + nom + ",\n\n" +
                "Un compte a été créé pour vous sur le système MedSys.\n\n" +
                "Vos identifiants :\n" +
                "Email : " + to + "\n" +
                "Mot de passe temporaire : " + tempPassword + "\n\n" +
                "Veuillez vous connecter et changer votre mot de passe dès que possible.\n" +
                frontendUrl + "/login\n\n" +
                "Cordialement,\nL'administrateur MedSys"
            );
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Erreur envoi email à {} : {}", to, e.getMessage());
        }
    }
}
