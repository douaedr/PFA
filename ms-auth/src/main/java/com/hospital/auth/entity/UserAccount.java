package com.hospital.auth.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.hospital.auth.enums.Role;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_accounts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @JsonIgnore
    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    // Reference to ms-patient (for PATIENT role)
    private Long patientId;

    // Reference to ms-personnel (for MEDECIN/PERSONNEL/DOCTOR/SECRETARY roles)
    private Long personnelId;

    // For SECRETARY role: ID of the doctor this secretary is assigned to manage
    private Long medecinAssigneId;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String prenom;

    private String cin;

    @Builder.Default
    private boolean enabled = true;

    // ── Password reset ────────────────────────────────────────────────────────
    @JsonIgnore
    private String resetToken;
    @JsonIgnore
    private LocalDateTime resetTokenExpiry;

    // ── Email verification ────────────────────────────────────────────────────
    @Builder.Default
    @Column(nullable = false, columnDefinition = "TINYINT(1) DEFAULT 0")
    private boolean emailVerified = false;

    @JsonIgnore
    private String emailVerificationToken;

    // ── Refresh token ─────────────────────────────────────────────────────────
    @JsonIgnore
    private String refreshToken;
    @JsonIgnore
    private LocalDateTime refreshTokenExpiry;

    // ── Brute-force protection ────────────────────────────────────────────────
    @Builder.Default
    @Column(nullable = false, columnDefinition = "INT DEFAULT 0")
    private int failedLoginAttempts = 0;

    private LocalDateTime accountLockedUntil;

    // ── Audit ─────────────────────────────────────────────────────────────────
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // ── Helpers ───────────────────────────────────────────────────────────────
    public boolean isAccountLocked() {
        return accountLockedUntil != null && accountLockedUntil.isAfter(LocalDateTime.now());
    }

    public void incrementFailedAttempts() {
        this.failedLoginAttempts++;
    }

    public void resetFailedAttempts() {
        this.failedLoginAttempts = 0;
        this.accountLockedUntil = null;
    }

    public void lockAccount(int lockMinutes) {
        this.accountLockedUntil = LocalDateTime.now().plusMinutes(lockMinutes);
    }
}
