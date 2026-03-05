package com.hospital.patient.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "consultations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Consultation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime dateConsultation;

    private String motif;

    @Column(columnDefinition = "TEXT")
    private String diagnostic;

    @Column(columnDefinition = "TEXT")
    private String observations;

    @Column(columnDefinition = "TEXT")
    private String traitement;

    private Double poids;
    private Double taille;
    private Integer tensionSystolique;
    private Integer tensionDiastolique;
    private Double temperature;

    @ManyToOne
    @JoinColumn(name = "medecin_id")
    @JsonIgnoreProperties("consultations")
    private Medecin medecin;
}
