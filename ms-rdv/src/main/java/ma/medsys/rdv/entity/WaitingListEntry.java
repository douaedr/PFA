package ma.medsys.rdv.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.medsys.rdv.enums.AppointmentPriority;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "waiting_list")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WaitingListEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long patientId;

    private String patientNom;
    private String patientPrenom;

    // nullable: specific doctor or any doctor of the specialite
    private Long medecinId;

    @Column(nullable = false)
    private Long specialiteId;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private AppointmentPriority priority = AppointmentPriority.NORMAL;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime dateAjout;

    @Column(length = 500)
    private String motif;

    @Builder.Default
    private boolean notifie = false;
}
