package com.hospital.auth.service;

import com.hospital.auth.dto.*;
import com.hospital.auth.entity.UserAccount;
import com.hospital.auth.enums.Role;
import com.hospital.auth.exception.AuthException;
import com.hospital.auth.repository.UserAccountRepository;
import com.hospital.auth.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserAccountRepository userRepo;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Value("${ms-patient.url}")
    private String msPatientUrl;

    // ── Login ─────────────────────────────────────────────────────────────────
    public AuthResponse login(LoginRequest req) {
        UserAccount user = userRepo.findByEmail(req.getEmail())
                .orElseThrow(() -> new AuthException("Email ou mot de passe incorrect"));

        if (!user.isEnabled()) {
            throw new AuthException("Compte désactivé. Contactez l'administrateur.");
        }

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new AuthException("Email ou mot de passe incorrect");
        }

        return buildAuthResponse(user);
    }

    // ── Register Patient ──────────────────────────────────────────────────────
    public AuthResponse registerPatient(RegisterPatientRequest req) {
        if (userRepo.existsByEmail(req.getEmail())) {
            throw new AuthException("Un compte avec cet email existe déjà");
        }
        if (userRepo.existsByCin(req.getCin())) {
            throw new AuthException("Un compte avec ce CIN existe déjà");
        }

        // 1. Créer le patient dans ms-patient via REST
        Long patientId = createPatientInMsPatient(req);

        // 2. Créer le compte user
        UserAccount user = UserAccount.builder()
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .role(Role.PATIENT)
                .nom(req.getNom())
                .prenom(req.getPrenom())
                .cin(req.getCin())
                .patientId(patientId)
                .enabled(true)
                .build();

        userRepo.save(user);
        log.info("Patient enregistré : {} {}", req.getNom(), req.getPrenom());

        return buildAuthResponse(user);
    }

    // ── Créer compte Médecin/Personnel (par Admin) ────────────────────────────
    public AuthResponse createPersonnelAccount(CreatePersonnelRequest req) {
        if (userRepo.existsByEmail(req.getEmail())) {
            throw new AuthException("Un compte avec cet email existe déjà");
        }

        UserAccount user = UserAccount.builder()
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .role(req.getRole())
                .nom(req.getNom())
                .prenom(req.getPrenom())
                .cin(req.getCin())
                .personnelId(req.getPersonnelId())
                .enabled(true)
                .build();

        userRepo.save(user);

        // Envoyer email avec les identifiants
        emailService.sendAccountCreatedEmail(user.getEmail(), user.getNom(), req.getPassword());

        return buildAuthResponse(user);
    }

    // ── Mot de passe oublié ───────────────────────────────────────────────────
    public void forgotPassword(ForgotPasswordRequest req) {
        UserAccount user = userRepo.findByEmail(req.getEmail())
                .orElseThrow(() -> new AuthException("Aucun compte trouvé avec cet email"));

        String token = UUID.randomUUID().toString();
        user.setResetToken(token);
        user.setResetTokenExpiry(LocalDateTime.now().plusHours(1));
        userRepo.save(user);

        emailService.sendPasswordResetEmail(user.getEmail(), user.getNom(), token);
        log.info("Email de réinitialisation envoyé à {}", user.getEmail());
    }

    // ── Réinitialiser mot de passe ────────────────────────────────────────────
    public void resetPassword(ResetPasswordRequest req) {
        UserAccount user = userRepo.findByResetToken(req.getToken())
                .orElseThrow(() -> new AuthException("Token invalide ou expiré"));

        if (user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new AuthException("Token expiré. Veuillez refaire la demande.");
        }

        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepo.save(user);
        log.info("Mot de passe réinitialisé pour {}", user.getEmail());
    }

    // ── Changer mot de passe ──────────────────────────────────────────────────
    public void changePassword(String email, ChangePasswordRequest req) {
        UserAccount user = userRepo.findByEmail(email)
                .orElseThrow(() -> new AuthException("Utilisateur non trouvé"));

        if (!passwordEncoder.matches(req.getOldPassword(), user.getPassword())) {
            throw new AuthException("Ancien mot de passe incorrect");
        }

        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepo.save(user);
    }

    // ── Vérifier token ────────────────────────────────────────────────────────
    public Map<String, Object> verifyToken(String token) {
        Map<String, Object> result = new HashMap<>();
        boolean valid = jwtService.isTokenValid(token);
        result.put("valid", valid);
        if (valid) {
            result.put("email", jwtService.extractEmail(token));
            result.put("role", jwtService.extractRole(token));
            result.put("userId", jwtService.extractUserId(token));
        }
        return result;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private AuthResponse buildAuthResponse(UserAccount user) {
        return AuthResponse.builder()
                .token(jwtService.generateToken(user))
                .type("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .role(user.getRole().name())
                .patientId(user.getPatientId())
                .personnelId(user.getPersonnelId())
                .build();
    }

    private Long createPatientInMsPatient(RegisterPatientRequest req) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Construire le body pour ms-patient
            Map<String, Object> body = new HashMap<>();
            body.put("nom", req.getNom());
            body.put("prenom", req.getPrenom());
            body.put("cin", req.getCin().toUpperCase());
            body.put("dateNaissance", req.getDateNaissance().toString());
            body.put("sexe", req.getSexe());
            body.put("groupeSanguin", req.getGroupeSanguin());
            body.put("telephone", req.getTelephone());
            body.put("email", req.getEmail());
            body.put("adresse", req.getAdresse());
            body.put("ville", req.getVille());
            body.put("mutuelle", req.getMutuelle());
            body.put("numeroCNSS", req.getNumeroCNSS());

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    msPatientUrl + "/api/v1/patients", entity, Map.class);

            if (response.getBody() != null && response.getBody().get("id") != null) {
                return Long.valueOf(response.getBody().get("id").toString());
            }
        } catch (Exception e) {
            log.warn("ms-patient non disponible, patient créé sans lien : {}", e.getMessage());
        }
        return null;
    }
}
