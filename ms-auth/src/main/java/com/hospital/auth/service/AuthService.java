package com.hospital.auth.service;

import com.hospital.auth.dto.*;
import com.hospital.auth.entity.AuditLog;
import com.hospital.auth.entity.UserAccount;
import com.hospital.auth.enums.Role;
import com.hospital.auth.exception.AuthException;
import com.hospital.auth.messaging.EventPublisher;
import com.hospital.auth.repository.AuditLogRepository;
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

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCK_DURATION_MINUTES = 15;

    private final UserAccountRepository userRepo;
    private final AuditLogRepository auditRepo;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final EventPublisher eventPublisher;

    @Value("${ms-patient.url}")
    private String msPatientUrl;

    @Value("${jwt.refresh-expiration:604800000}")
    private long refreshExpiration;

    @Value("${app.email-verification.required:false}")
    private boolean emailVerificationRequired;

    // ── Login ─────────────────────────────────────────────────────────────────
    public AuthResponse login(LoginRequest req, String ipAddress) {
        UserAccount user = userRepo.findByEmail(req.getEmail())
                .orElseThrow(() -> {
                    audit("LOGIN_FAILURE", req.getEmail(), ipAddress, "Email not found");
                    return new AuthException("Email ou mot de passe incorrect");
                });

        if (!user.isEnabled()) {
            audit("LOGIN_FAILURE", req.getEmail(), ipAddress, "Account disabled");
            throw new AuthException("Votre compte est désactivé. Contactez l'administrateur.",
                    org.springframework.http.HttpStatus.FORBIDDEN);
        }

        if (user.isAccountLocked()) {
            audit("LOGIN_FAILURE", req.getEmail(), ipAddress, "Account temporarily locked");
            throw new AuthException("Compte temporairement verrouillé après trop de tentatives. "
                    + "Réessayez dans " + LOCK_DURATION_MINUTES + " minutes.",
                    org.springframework.http.HttpStatus.FORBIDDEN);
        }

        if (emailVerificationRequired && !user.isEmailVerified()) {
            audit("LOGIN_FAILURE", req.getEmail(), ipAddress, "Email not verified");
            throw new AuthException("Veuillez vérifier votre adresse email avant de vous connecter. "
                    + "Consultez votre boite mail.",
                    org.springframework.http.HttpStatus.FORBIDDEN);
        }

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            handleFailedLogin(user, ipAddress);
            throw new AuthException("Email ou mot de passe incorrect");
        }

        // Successful login — reset brute-force counters
        user.resetFailedAttempts();
        issueRefreshToken(user);
        userRepo.save(user);

        audit("LOGIN_SUCCESS", user.getEmail(), ipAddress, "role=" + user.getRole());
        eventPublisher.publishUserLoggedIn(user);

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

        Long patientId = createPatientInMsPatient(req);

        String verificationToken = UUID.randomUUID().toString();

        UserAccount user = UserAccount.builder()
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .role(Role.PATIENT)
                .nom(req.getNom())
                .prenom(req.getPrenom())
                .cin(req.getCin())
                .patientId(patientId)
                .enabled(true)
                .emailVerified(false)
                .emailVerificationToken(verificationToken)
                .failedLoginAttempts(0)
                .build();

        userRepo.save(user);

        emailService.sendVerificationEmail(user.getEmail(), user.getNom(), verificationToken);

        audit("REGISTRATION", user.getEmail(), null,
                "Patient registered: " + user.getNom() + " " + user.getPrenom());
        eventPublisher.publishUserCreated(user);

        log.info("[AUDIT] New patient registered: {} {} (email={})",
                req.getNom(), req.getPrenom(), req.getEmail());

        return buildAuthResponse(user);
    }

    // ── Verify Email ──────────────────────────────────────────────────────────
    public void verifyEmail(String token) {
        UserAccount user = userRepo.findByEmailVerificationToken(token)
                .orElseThrow(() -> new AuthException("Token de vérification invalide ou déjà utilisé"));

        user.setEmailVerified(true);
        user.setEmailVerificationToken(null);
        userRepo.save(user);

        audit("EMAIL_VERIFIED", user.getEmail(), null, "Email verified successfully");
        log.info("[AUDIT] Email verified for: {}", user.getEmail());
    }

    // ── Refresh Token ─────────────────────────────────────────────────────────
    public AuthResponse refreshToken(String refreshToken) {
        UserAccount user = userRepo.findByRefreshToken(refreshToken)
                .orElseThrow(() -> new AuthException("Refresh token invalide ou expiré"));

        if (user.getRefreshTokenExpiry() == null
                || user.getRefreshTokenExpiry().isBefore(LocalDateTime.now())) {
            user.setRefreshToken(null);
            user.setRefreshTokenExpiry(null);
            userRepo.save(user);
            throw new AuthException("Refresh token expiré. Veuillez vous reconnecter.");
        }

        // Issue a fresh refresh token on every use (rotation)
        issueRefreshToken(user);
        userRepo.save(user);

        return buildAuthResponse(user);
    }

    // ── Create Personnel Account (Admin only) ─────────────────────────────────
    public AuthResponse createPersonnelAccount(CreatePersonnelRequest req) {
        if (userRepo.existsByEmail(req.getEmail())) {
            throw new AuthException("Un compte avec cet email existe déjà");
        }

        String verificationToken = UUID.randomUUID().toString();

        UserAccount user = UserAccount.builder()
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .role(req.getRole())
                .nom(req.getNom())
                .prenom(req.getPrenom())
                .cin(req.getCin())
                .personnelId(req.getPersonnelId())
                .medecinAssigneId(req.getMedecinAssigneId())
                .enabled(true)
                .emailVerified(true)   // admin-created accounts are pre-verified
                .emailVerificationToken(null)
                .failedLoginAttempts(0)
                .build();

        userRepo.save(user);

        audit("REGISTRATION", user.getEmail(), null,
                "Personnel account created by admin, role=" + req.getRole());
        eventPublisher.publishUserCreated(user);

        emailService.sendAccountCreatedEmail(user.getEmail(), user.getNom(), req.getPassword());

        log.info("[AUDIT] Personnel account created: {} {} (role={}, email={})",
                req.getNom(), req.getPrenom(), req.getRole(), req.getEmail());

        return buildAuthResponse(user);
    }

    // ── Forgot Password ───────────────────────────────────────────────────────
    public void forgotPassword(ForgotPasswordRequest req) {
        // Never reveal whether the email exists (prevents user enumeration)
        userRepo.findByEmail(req.getEmail()).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            user.setResetToken(token);
            user.setResetTokenExpiry(LocalDateTime.now().plusHours(1));
            userRepo.save(user);
            emailService.sendPasswordResetEmail(user.getEmail(), user.getNom(), token);
            audit("PASSWORD_RESET_REQUEST", user.getEmail(), null, "Reset token generated");
            log.info("[AUDIT] Password reset requested for {}", user.getEmail());
        });
    }

    // ── Reset Password ────────────────────────────────────────────────────────
    public void resetPassword(ResetPasswordRequest req) {
        UserAccount user = userRepo.findByResetToken(req.getToken())
                .orElseThrow(() -> new AuthException("Token invalide ou expiré"));

        if (user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new AuthException("Token expiré. Veuillez refaire la demande.");
        }

        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        user.resetFailedAttempts();   // clear any lockout on password reset
        userRepo.save(user);

        audit("PASSWORD_RESET", user.getEmail(), null, "Password successfully reset");
        log.info("[AUDIT] Password reset for {}", user.getEmail());
    }

    // ── Change Password ───────────────────────────────────────────────────────
    public void changePassword(String email, ChangePasswordRequest req) {
        UserAccount user = userRepo.findByEmail(email)
                .orElseThrow(() -> new AuthException("Utilisateur non trouvé"));

        if (!passwordEncoder.matches(req.getOldPassword(), user.getPassword())) {
            throw new AuthException("Ancien mot de passe incorrect");
        }

        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepo.save(user);
        audit("PASSWORD_CHANGED", email, null, "Password changed");
    }

    // ── Verify JWT Token ──────────────────────────────────────────────────────
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

    // ── Brute-Force Helpers ───────────────────────────────────────────────────
    private void handleFailedLogin(UserAccount user, String ipAddress) {
        user.incrementFailedAttempts();
        if (user.getFailedLoginAttempts() >= MAX_FAILED_ATTEMPTS) {
            user.lockAccount(LOCK_DURATION_MINUTES);
            audit("ACCOUNT_LOCKED", user.getEmail(), ipAddress,
                    "Locked after " + MAX_FAILED_ATTEMPTS + " failed attempts");
            log.warn("[SECURITY] Account locked for {} after {} failed attempts",
                    user.getEmail(), MAX_FAILED_ATTEMPTS);
        } else {
            audit("LOGIN_FAILURE", user.getEmail(), ipAddress,
                    "Wrong password, attempt=" + user.getFailedLoginAttempts());
            log.warn("[AUDIT] Failed login for {} (attempt {})",
                    user.getEmail(), user.getFailedLoginAttempts());
        }
        userRepo.save(user);
    }

    // ── Token Helpers ─────────────────────────────────────────────────────────
    private void issueRefreshToken(UserAccount user) {
        user.setRefreshToken(UUID.randomUUID().toString());
        user.setRefreshTokenExpiry(
                LocalDateTime.now().plusSeconds(refreshExpiration / 1000));
    }

    private AuthResponse buildAuthResponse(UserAccount user) {
        return AuthResponse.builder()
                .token(jwtService.generateToken(user))
                .refreshToken(user.getRefreshToken())
                .type("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .role(user.getRole().name())
                .patientId(user.getPatientId())
                .personnelId(user.getPersonnelId())
                .emailVerified(user.isEmailVerified())
                .build();
    }

    // ── Audit Helper ──────────────────────────────────────────────────────────
    private void audit(String eventType, String email, String ipAddress, String details) {
        try {
            auditRepo.save(AuditLog.builder()
                    .eventType(eventType)
                    .email(email)
                    .ipAddress(ipAddress)
                    .details(details)
                    .build());
        } catch (Exception e) {
            log.warn("[AUDIT] Failed to persist audit log: {}", e.getMessage());
        }
    }

    // ── Create patient in ms-patient via REST ─────────────────────────────────
    private Long createPatientInMsPatient(RegisterPatientRequest req) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            // Token de service interne pour s'authentifier auprès de ms-patient-personnel
            headers.setBearerAuth(jwtService.generateServiceToken());

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

            if (req.getAntecedents() != null) body.put("antecedents", req.getAntecedents());
            if (req.getOrdonnances() != null) body.put("ordonnances", req.getOrdonnances());
            if (req.getAnalyses()    != null) body.put("analyses", req.getAnalyses());

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    msPatientUrl + "/api/v1/patients", entity, Map.class);

            if (response.getBody() != null && response.getBody().get("id") != null) {
                return Long.valueOf(response.getBody().get("id").toString());
            }
        } catch (Exception e) {
            log.warn("ms-patient unavailable, patient created without link: {}", e.getMessage());
        }
        return null;
    }
}
