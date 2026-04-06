package ma.medsys.rdv.dto;

import lombok.*;
import ma.medsys.rdv.enums.AppointmentPriority;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentRequest {

    private Long patientId;
    private Long medecinId;
    private Long creneauId;
    private String motif;
    private AppointmentPriority priority;
    private String patientNom;
    private String patientPrenom;
    private String medecinNom;
    private String medecinPrenom;
    private Long specialiteId;
}
