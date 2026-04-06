package ma.medsys.rdv.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.medsys.rdv.enums.AppointmentPriority;
import ma.medsys.rdv.enums.AppointmentStatus;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long patientId;

    @Column(nullable = false)
    private Long medecinId;

    @Column(name = "creneau_id")
    private Long creneauId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AppointmentStatus status = AppointmentStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AppointmentPriority priority = AppointmentPriority.NORMAL;

    @Column(nullable = false)
    private LocalDateTime dateHeure;

    @Column(length = 500)
    private String motif;

    @Column(length = 1000)
    private String notes;

    @Builder.Default
    private boolean rappelEnvoye = false;

    @Builder.Default
    private int noShowCount = 0;

    private String patientNom;
    private String patientPrenom;
    private String medecinNom;
    private String medecinPrenom;

    private Long specialiteId;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
