package ma.medsys.rdv.dto;

import lombok.*;
import ma.medsys.rdv.enums.AppointmentPriority;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WaitlistRequest {

    private Long patientId;
    private String patientNom;
    private String patientPrenom;
    private Long medecinId; // optional: specific doctor, or null for any
    private Long specialiteId;
    private AppointmentPriority priority;
    private String motif;
}
