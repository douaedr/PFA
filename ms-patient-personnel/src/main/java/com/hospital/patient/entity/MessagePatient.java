package com.hospital.patient.entity;

import com.hospital.patient.enums.ExpediteurMessage;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "messages_patient")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessagePatient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dossier_id", nullable = false)
    private DossierMedical dossierMedical;

    @Column(nullable = false, length = 1000)
    private String contenu;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExpediteurMessage expediteur;

    @Column(nullable = false)
    @Builder.Default
    private Boolean lu = false;

    private Long medecinId;

    private String medecinNom;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime dateEnvoi;
}
