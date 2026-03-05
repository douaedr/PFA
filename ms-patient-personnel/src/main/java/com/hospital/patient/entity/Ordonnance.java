package com.hospital.patient.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.hospital.patient.enums.TypeOrdonnance;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ordonnances")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Ordonnance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate dateOrdonnance;

    @Enumerated(EnumType.STRING)
    private TypeOrdonnance typeOrdonnance;

    @Column(columnDefinition = "TEXT")
    private String instructions;

    private Boolean estRenouvele = false;
    private LocalDate dateExpiration;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "ordonnance_id")
    @Builder.Default
    private List<LigneOrdonnance> lignes = new ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "medecin_id")
    @JsonIgnoreProperties("ordonnances")
    private Medecin medecin;
}
