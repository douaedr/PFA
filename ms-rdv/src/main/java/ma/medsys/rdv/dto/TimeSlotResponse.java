package ma.medsys.rdv.dto;

import lombok.*;
import ma.medsys.rdv.enums.SlotType;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimeSlotResponse {

    private Long id;
    private Long medecinId;
    private String medecinNom;
    private String medecinPrenom;
    private Long specialiteId;
    private LocalDateTime debut;
    private LocalDateTime fin;
    private boolean disponible;
    private int dureeMinutes;
    private SlotType type;
    private LocalDateTime createdAt;
}
