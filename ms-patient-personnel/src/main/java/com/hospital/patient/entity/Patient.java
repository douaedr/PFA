package com.hospital.patient.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.hospital.patient.enums.GroupeSanguin;
import com.hospital.patient.enums.Sexe;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "patients")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String prenom;

    @Column(nullable = false, unique = true)
    private String cin;

    @Column(nullable = false)
    private LocalDate dateNaissance;

    @Enumerated(EnumType.STRING)
    private Sexe sexe;

    @Enumerated(EnumType.STRING)
    private GroupeSanguin groupeSanguin;

    private String telephone;
    private String email;
    private String adresse;
    private String ville;
    private String mutuelle;
    private String numeroCNSS;

    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "dossier_medical_id")
    @JsonIgnoreProperties("patient")
    private DossierMedical dossierMedical;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
