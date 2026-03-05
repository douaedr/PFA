package com.hospital.patient.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "historique_medical")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HistoriqueMedical {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String action; // ex: CREATION, MODIFICATION, CONSULTATION_AJOUTEE

    @Column(columnDefinition = "TEXT")
    private String details;

    private String utilisateur;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime dateAction;
}
