package com.hospital.patient.entity;

import com.hospital.patient.enums.TypeCertificat;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "certificats_medicaux")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CertificatMedical {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeCertificat typeCertificat;

    @Column(nullable = false)
    private LocalDate dateEmission;

    @Column(columnDefinition = "TEXT")
    private String contenu;

    private Integer dureeJours;

    @ManyToOne
    @JoinColumn(name = "medecin_id")
    private Medecin medecin;
}
