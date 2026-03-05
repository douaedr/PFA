package com.hospital.patient.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "specialites")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Specialite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String nom;

    @Column(unique = true)
    private String code;

    private String description;
}
