package com.hospital.patient.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "medecins_ref")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Medecin {

    // ID identique à celui dans ms-personnel (pas auto-généré)
    @Id
    private Long id;

    private String nom;
    private String prenom;
    private String matricule;

    @ManyToOne
    @JoinColumn(name = "specialite_id")
    private Specialite specialite;

    @ManyToOne
    @JoinColumn(name = "service_id")
    private Service service;

    // Pour la synchronisation avec ms-personnel
    private LocalDateTime derniereSynchronisation;

    public String getNomComplet() {
        return "Dr. " + prenom + " " + nom;
    }
}
