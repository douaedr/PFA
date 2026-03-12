package com.hospital.patient.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.hospital.patient.enums.TypeDocument;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "documents_patient")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentPatient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dossier_id", nullable = false)
    @JsonIgnoreProperties("documents")
    private DossierMedical dossierMedical;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeDocument typeDocument;

    @Column(nullable = false)
    private String nomFichierOriginal;

    @Column(nullable = false)
    private String nomFichierStocke;

    @Column(nullable = false)
    private String cheminFichier;

    @Column(length = 500)
    private String description;

    private Long tailleFichier;

    private String contentType;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime dateUpload;
}
