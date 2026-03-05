package com.hospital.patient.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "lignes_ordonnance")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LigneOrdonnance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String medicament;

    private String dosage;
    private String posologie;
    private Integer dureeJours;
    private Integer quantite;

    @Column(columnDefinition = "TEXT")
    private String instructions;
}
