package com.hospital.patient.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "dossiers_medicaux")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DossierMedical {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String numeroDossier; // ex: DM-2024-00001

    @OneToOne(mappedBy = "dossierMedical")
    @JsonIgnoreProperties("dossierMedical")
    private Patient patient;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "dossier_id")
    @Builder.Default
    private List<Consultation> consultations = new ArrayList<>();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "dossier_id")
    @Builder.Default
    private List<Antecedent> antecedents = new ArrayList<>();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "dossier_id")
    @Builder.Default
    private List<Ordonnance> ordonnances = new ArrayList<>();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "dossier_id")
    @Builder.Default
    private List<AnalyseLaboratoire> analyses = new ArrayList<>();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "dossier_id")
    @Builder.Default
    private List<Radiologie> radiologies = new ArrayList<>();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "dossier_id")
    @Builder.Default
    private List<Hospitalisation> hospitalisations = new ArrayList<>();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "dossier_id")
    @Builder.Default
    private List<CertificatMedical> certificats = new ArrayList<>();

    @OneToMany(mappedBy = "dossierMedical", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DocumentPatient> documents = new ArrayList<>();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime dateCreation;

    @PrePersist
    public void generateNumeroDossier() {
        if (numeroDossier == null) {
            numeroDossier = "DM-" + LocalDate.now().getYear() + "-"
                + String.format("%05d", System.currentTimeMillis() % 100000);
        }
    }
}
