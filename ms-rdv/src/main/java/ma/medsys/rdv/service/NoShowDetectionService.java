package ma.medsys.rdv.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.medsys.rdv.enums.AppointmentStatus;
import ma.medsys.rdv.repository.AppointmentRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NoShowDetectionService {

    private final AppointmentRepository appointmentRepo;

    /**
     * Returns a list of patient IDs that have accumulated at least {@code threshold} no-shows.
     */
    public List<Long> getNoShowRiskPatients(int threshold) {
        List<Object[]> rows = appointmentRepo.findPatientIdsWithNoShowAbove(threshold);
        return rows.stream()
                .map(row -> ((Number) row[0]).longValue())
                .collect(Collectors.toList());
    }

    /**
     * Returns aggregate no-show statistics.
     */
    public Map<String, Object> getNoShowStats() {
        long totalNoShows = appointmentRepo.findByStatus(AppointmentStatus.NO_SHOW).size();
        long totalAppointments = appointmentRepo.count();
        double noShowRate = totalAppointments > 0 ? (totalNoShows * 100.0 / totalAppointments) : 0;

        List<Long> highRiskPatients = getNoShowRiskPatients(3);

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalNoShows", totalNoShows);
        stats.put("totalAppointments", totalAppointments);
        stats.put("noShowRate", Math.round(noShowRate * 10.0) / 10.0);
        stats.put("highRiskPatientCount", highRiskPatients.size());
        stats.put("highRiskPatientIds", highRiskPatients);

        log.info("No-show stats: totalNoShows={}, rate={}%", totalNoShows, noShowRate);
        return stats;
    }
}
