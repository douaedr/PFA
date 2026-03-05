package com.hospital.patient.entity;

import com.hospital.patient.enums.NiveauSeverite;
import com.hospital.patient.enums.TypeAntecedent;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "antecedents")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Antecedent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeAntecedent typeAntecedent;

    @Column(columnDefinition = "TEXT")
    private String description;

    private LocalDate dateDiagnostic;

    @Enumerated(EnumType.STRING)
    private NiveauSeverite severite;

    private Boolean actif = true;
    private String source;
}
