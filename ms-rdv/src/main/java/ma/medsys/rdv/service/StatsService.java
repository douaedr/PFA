package ma.medsys.rdv.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.medsys.rdv.dto.StatsOverview;
import ma.medsys.rdv.entity.Appointment;
import ma.medsys.rdv.entity.TimeSlot;
import ma.medsys.rdv.enums.AppointmentStatus;
import ma.medsys.rdv.repository.AppointmentRepository;
import ma.medsys.rdv.repository.TimeSlotRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StatsService {

    private final AppointmentRepository appointmentRepo;
    private final TimeSlotRepository slotRepo;

    public StatsOverview getOverview(LocalDate from, LocalDate to) {
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end = to.plusDays(1).atStartOfDay();

        List<Appointment> appointments = appointmentRepo.findByDateHeureBetween(start, end);

        long total = appointments.size();
        long completed = appointments.stream().filter(a -> a.getStatus() == AppointmentStatus.COMPLETED).count();
        long cancelled = appointments.stream().filter(a -> a.getStatus() == AppointmentStatus.CANCELLED).count();
        long noShows = appointments.stream().filter(a -> a.getStatus() == AppointmentStatus.NO_SHOW).count();

        double completionRate = total > 0 ? (completed * 100.0 / total) : 0;

        long totalSlots = slotRepo.count();
        long availableSlots = slotRepo.findAll().stream().filter(TimeSlot::isDisponible).count();
        double fillRate = totalSlots > 0 ? ((totalSlots - availableSlots) * 100.0 / totalSlots) : 0;

        // byDay grouping
        Map<LocalDate, Long> byDayMap = appointments.stream()
                .collect(Collectors.groupingBy(
                        a -> a.getDateHeure().toLocalDate(),
                        Collectors.counting()
                ));
        List<Map<String, Object>> byDay = byDayMap.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> Map.<String, Object>of("date", e.getKey().toString(), "count", e.getValue()))
                .collect(Collectors.toList());

        // byDoctor grouping
        Map<Long, List<Appointment>> byDoctorMap = appointments.stream()
                .collect(Collectors.groupingBy(Appointment::getMedecinId));
        List<Map<String, Object>> byDoctor = byDoctorMap.entrySet().stream()
                .map(e -> {
                    long doctorNoShows = e.getValue().stream()
                            .filter(a -> a.getStatus() == AppointmentStatus.NO_SHOW).count();
                    String nom = e.getValue().get(0).getMedecinNom() + " " + e.getValue().get(0).getMedecinPrenom();
                    return Map.<String, Object>of(
                            "medecinId", e.getKey(),
                            "nom", nom,
                            "count", (long) e.getValue().size(),
                            "noShows", doctorNoShows
                    );
                })
                .collect(Collectors.toList());

        // bySpecialite grouping
        Map<Long, Long> bySpecialiteMap = appointments.stream()
                .filter(a -> a.getSpecialiteId() != null)
                .collect(Collectors.groupingBy(Appointment::getSpecialiteId, Collectors.counting()));
        List<Map<String, Object>> bySpecialite = bySpecialiteMap.entrySet().stream()
                .map(e -> Map.<String, Object>of("specialiteId", e.getKey(), "count", e.getValue()))
                .collect(Collectors.toList());

        log.info("Stats overview computed: from={}, to={}, total={}", from, to, total);

        return StatsOverview.builder()
                .totalAppointments(total)
                .completed(completed)
                .cancelled(cancelled)
                .noShows(noShows)
                .completionRate(Math.round(completionRate * 10.0) / 10.0)
                .fillRate(Math.round(fillRate * 10.0) / 10.0)
                .avgWaitDays(2.5) // TODO: compute from actual scheduling data
                .byDay(byDay)
                .byDoctor(byDoctor)
                .bySpecialite(bySpecialite)
                .totalSlots(totalSlots)
                .availableSlots(availableSlots)
                .build();
    }
}
