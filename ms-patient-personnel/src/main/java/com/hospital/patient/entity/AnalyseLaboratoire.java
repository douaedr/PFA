package com.hospital.patient.entity;

import com.hospital.patient.enums.NiveauSeverite;
import com.hospital.patient.enums.StatutAnalyse;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "analyses_laboratoire")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyseLaboratoire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate dateAnalyse;
    private LocalDate dateResultat;

    @Column(nullable = false)
    private String typeAnalyse;

    @Column(columnDefinition = "TEXT")
    private String resultats;

    @Column(columnDefinition = "TEXT")
    private String valeurReference;

    @Enumerated(EnumType.STRING)
    private StatutAnalyse statut;

    @Enumerated(EnumType.STRING)
    private NiveauSeverite severite;

    private String laboratoire;
    private String prescripteur;
    private String cheminFichier;
}
