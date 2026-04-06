package ma.medsys.rdv.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import ma.medsys.rdv.dto.StatsOverview;
import ma.medsys.rdv.entity.Appointment;
import ma.medsys.rdv.repository.AppointmentRepository;
import ma.medsys.rdv.service.NoShowDetectionService;
import ma.medsys.rdv.service.StatsService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/rdv/stats")
@RequiredArgsConstructor
@Tag(name = "Statistics", description = "Appointment statistics for directors and admins")
public class StatsController {

    private final StatsService statsService;
    private final NoShowDetectionService noShowDetectionService;
    private final AppointmentRepository appointmentRepo;

    @GetMapping("/overview")
    @PreAuthorize("hasAnyRole('DIRECTEUR','ADMIN')")
    @Operation(summary = "Get appointment statistics overview")
    public ResponseEntity<StatsOverview> getOverview(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(statsService.getOverview(from, to));
    }

    @GetMapping("/noshows")
    @PreAuthorize("hasAnyRole('DIRECTEUR','ADMIN')")
    @Operation(summary = "Get patients with no-show count above threshold")
    public ResponseEntity<Map<String, Object>> getNoShowPatients(
            @RequestParam(defaultValue = "3") int threshold) {
        List<Long> riskPatients = noShowDetectionService.getNoShowRiskPatients(threshold);
        Map<String, Object> stats = noShowDetectionService.getNoShowStats();
        return ResponseEntity.ok(Map.of(
                "threshold", threshold,
                "riskPatientIds", riskPatients,
                "stats", stats
        ));
    }

    @GetMapping("/daily")
    @PreAuthorize("hasAnyRole('DIRECTEUR','ADMIN')")
    @Operation(summary = "Get appointment counts for a specific date")
    public ResponseEntity<Map<String, Object>> getDailyStats(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        List<Appointment> dayAppointments = appointmentRepo.findByDate(date);

        long total = dayAppointments.size();
        long confirmed = dayAppointments.stream()
                .filter(a -> a.getStatus().name().equals("CONFIRMED")).count();
        long pending = dayAppointments.stream()
                .filter(a -> a.getStatus().name().equals("PENDING")).count();
        long cancelled = dayAppointments.stream()
                .filter(a -> a.getStatus().name().equals("CANCELLED")).count();
        long completed = dayAppointments.stream()
                .filter(a -> a.getStatus().name().equals("COMPLETED")).count();
        long noShow = dayAppointments.stream()
                .filter(a -> a.getStatus().name().equals("NO_SHOW")).count();

        List<Map<String, Object>> byHour = dayAppointments.stream()
                .collect(Collectors.groupingBy(
                        a -> a.getDateHeure().getHour(),
                        Collectors.counting()
                ))
                .entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> Map.<String, Object>of("hour", e.getKey(), "count", e.getValue()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
                "date", date.toString(),
                "total", total,
                "confirmed", confirmed,
                "pending", pending,
                "cancelled", cancelled,
                "completed", completed,
                "noShow", noShow,
                "byHour", byHour
        ));
    }
}
