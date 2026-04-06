package ma.medsys.rdv.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.medsys.rdv.enums.SlotType;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "time_slots")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimeSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long medecinId;

    private String medecinNom;
    private String medecinPrenom;

    private Long specialiteId;

    @Column(nullable = false)
    private LocalDateTime debut;

    @Column(nullable = false)
    private LocalDateTime fin;

    @Builder.Default
    private boolean disponible = true;

    @Builder.Default
    private int dureeMinutes = 30;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private SlotType type = SlotType.CONSULTATION;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
