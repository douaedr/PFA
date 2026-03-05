package com.hospital.patient.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "etats_actuels")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EtatActuel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String symptomes;

    @Column(columnDefinition = "TEXT")
    private String traitementEnCours;

    @Column(columnDefinition = "TEXT")
    private String allergiesActives;

    private Double poidsActuel;
    private Double tailleActuelle;

    @UpdateTimestamp
    private LocalDateTime dateMiseAJour;
}
