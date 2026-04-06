package ma.medsys.rdv.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SlotRecommendation {

    private TimeSlotResponse timeSlot;
    private double score;
    private String reason;
}
