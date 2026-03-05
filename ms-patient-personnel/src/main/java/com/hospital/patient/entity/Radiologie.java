package com.hospital.patient.entity;

import com.hospital.patient.enums.TypeExamen;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "radiologies")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Radiologie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate dateExamen;

    @Enumerated(EnumType.STRING)
    private TypeExamen typeExamen;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String conclusion;

    private String cheminFichier;
    private String prescripteur;
    private String radiologue;
}
