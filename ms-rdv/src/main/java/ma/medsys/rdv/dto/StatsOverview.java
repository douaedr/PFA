package ma.medsys.rdv.dto;

import lombok.*;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatsOverview {

    private long totalAppointments;
    private long completed;
    private long cancelled;
    private long noShows;
    private double completionRate;
    private double fillRate;
    private double avgWaitDays;

    // [{date: "2026-04-01", count: 12}, ...]
    private List<Map<String, Object>> byDay;

    // [{medecinId: 1, nom: "Dr. X", count: 20, noShows: 2}, ...]
    private List<Map<String, Object>> byDoctor;

    // [{specialiteId: 1, count: 30}, ...]
    private List<Map<String, Object>> bySpecialite;

    private long totalSlots;
    private long availableSlots;
}
