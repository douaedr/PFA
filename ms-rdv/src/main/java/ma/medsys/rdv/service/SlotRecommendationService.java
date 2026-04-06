package ma.medsys.rdv.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.medsys.rdv.dto.SlotRecommendation;
import ma.medsys.rdv.dto.TimeSlotResponse;
import ma.medsys.rdv.entity.TimeSlot;
import ma.medsys.rdv.enums.AppointmentPriority;
import ma.medsys.rdv.repository.AppointmentRepository;
import ma.medsys.rdv.repository.TimeSlotRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SlotRecommendationService {

    private final TimeSlotRepository slotRepo;
    private final AppointmentRepository appointmentRepo;
    private final TimeSlotService timeSlotService;

    public List<SlotRecommendation> recommend(Long patientId, Long specialiteId, AppointmentPriority priority) {
        LocalDateTime from = LocalDateTime.now();
        LocalDateTime to = (priority == AppointmentPriority.URGENT || priority == AppointmentPriority.TRES_URGENT)
                ? from.plusDays(2)
                : from.plusDays(7);

        List<TimeSlot> available = slotRepo.findBySpecialiteIdAndDisponibleTrueAndDebutBetween(specialiteId, from, to);

        log.debug("Slot recommendation: specialiteId={}, priority={}, found {} candidates",
                specialiteId, priority, available.size());

        return available.stream().map(slot -> {
            double score = 100.0;
            String reason = "";

            // Load factor: penalise busy doctors
            long load = appointmentRepo.countByMedecinIdAndDateHeureBetween(
                    slot.getMedecinId(),
                    slot.getDebut().toLocalDate().atStartOfDay(),
                    slot.getDebut().toLocalDate().plusDays(1).atStartOfDay()
            );
            score -= (load * 5);

            // Morning preference
            int hour = slot.getDebut().getHour();
            if (hour >= 8 && hour <= 12) {
                score += 10;
                reason = "Créneau matinal disponible";
            }

            // Urgency: favour soon slots
            if (priority == AppointmentPriority.URGENT || priority == AppointmentPriority.TRES_URGENT) {
                long hoursUntil = ChronoUnit.HOURS.between(LocalDateTime.now(), slot.getDebut());
                score += Math.max(0, 50 - hoursUntil);
                reason = "Créneau rapide disponible";
            }

            TimeSlotResponse slotResponse = timeSlotService.toResponse(slot);
            return new SlotRecommendation(slotResponse, score, reason);
        })
        .sorted(Comparator.comparingDouble(SlotRecommendation::getScore).reversed())
        .limit(5)
        .collect(Collectors.toList());
    }
}
