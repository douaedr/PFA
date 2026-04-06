package ma.medsys.rdv.dto;

import lombok.*;
import ma.medsys.rdv.enums.AppointmentPriority;
import ma.medsys.rdv.enums.AppointmentStatus;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentResponse {

    private Long id;
    private Long patientId;
    private Long medecinId;
    private Long creneauId;
    private AppointmentStatus status;
    private AppointmentPriority priority;
    private LocalDateTime dateHeure;
    private String motif;
    private String notes;
    private boolean rappelEnvoye;
    private int noShowCount;
    private String patientNom;
    private String patientPrenom;
    private String medecinNom;
    private String medecinPrenom;
    private Long specialiteId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Computed: French label for status
    private String statusLabel;

    public static String computeStatusLabel(AppointmentStatus status) {
        if (status == null) return "";
        return switch (status) {
            case PENDING -> "En attente";
            case CONFIRMED -> "Confirmé";
            case CANCELLED -> "Annulé";
            case COMPLETED -> "Terminé";
            case NO_SHOW -> "Patient absent";
        };
    }
}
