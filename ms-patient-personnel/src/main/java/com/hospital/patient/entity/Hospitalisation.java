package com.hospital.patient.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "hospitalisations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Hospitalisation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate dateEntree;

    private LocalDate dateSortie; // null si encore hospitalisé

    private String motif;
    private String diagnostic;
    private String numeroChambre;

    @ManyToOne
    @JoinColumn(name = "service_id")
    private Service service;

    @ManyToOne
    @JoinColumn(name = "medecin_responsable_id")
    @JsonIgnoreProperties("hospitalisations")
    private Medecin medecinResponsable;

    @Column(columnDefinition = "TEXT")
    private String compteRendu;

    private Boolean actif = true;
}
