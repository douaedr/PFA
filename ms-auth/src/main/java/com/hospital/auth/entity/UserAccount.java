package com.hospital.auth.entity;

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

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    // Pour PATIENT : référence vers ms-patient (patientId)
    private Long patientId;

    // Pour MEDECIN/PERSONNEL : référence vers ms-personnel
    private Long personnelId;

    // Infos basiques affichées partout
    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String prenom;

    private String cin;

    private boolean enabled = true;

    // Pour mot de passe oublié
    private String resetToken;
    private LocalDateTime resetTokenExpiry;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
