package ma.medsys.rdv.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.medsys.rdv.dto.AppointmentRequest;
import ma.medsys.rdv.dto.WaitlistRequest;
import ma.medsys.rdv.entity.TimeSlot;
import ma.medsys.rdv.entity.WaitingListEntry;
import ma.medsys.rdv.enums.AppointmentPriority;
import ma.medsys.rdv.repository.TimeSlotRepository;
import ma.medsys.rdv.repository.WaitingListRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WaitingListService {

    private final WaitingListRepository waitingListRepo;
    private final TimeSlotRepository slotRepo;
    private final AppointmentService appointmentService;

    @Transactional
    public WaitingListEntry addToWaitlist(WaitlistRequest req) {
        AppointmentPriority priority = req.getPriority() != null ? req.getPriority() : AppointmentPriority.NORMAL;

        WaitingListEntry entry = WaitingListEntry.builder()
                .patientId(req.getPatientId())
                .patientNom(req.getPatientNom())
                .patientPrenom(req.getPatientPrenom())
                .medecinId(req.getMedecinId())
                .specialiteId(req.getSpecialiteId())
                .priority(priority)
                .motif(req.getMotif())
                .notifie(false)
                .build();

        entry = waitingListRepo.save(entry);
        log.info("Patient {} added to waiting list for specialiteId={}", req.getPatientId(), req.getSpecialiteId());
        return entry;
    }

    public List<WaitingListEntry> getByPatientId(Long patientId) {
        return waitingListRepo.findByPatientId(patientId);
    }

    @Transactional
    public void removeFromWaitlist(Long id) {
        WaitingListEntry entry = waitingListRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Entrée de liste d'attente introuvable: " + id));
        waitingListRepo.delete(entry);
        log.info("Waiting list entry removed: id={}", id);
    }

    /**
     * Runs every 5 minutes.
     * Finds recently cancelled/freed slots and attempts to match them with the highest-priority
     * waiting list entry for the same specialite or medecin, then auto-creates an appointment.
     */
    @Scheduled(fixedDelay = 300_000)
    @Transactional
    public void processWaitingList() {
        log.debug("Processing waiting list...");

        // Find freed slots in the future that are currently disponible=true
        // (were previously booked and are now freed via cancellation — see AppointmentService.cancel)
        List<TimeSlot> freedSlots = slotRepo.findByDisponibleFalseAndDebutAfter(LocalDateTime.now())
                .stream()
                // Re-check: actually we want disponible=true future slots to match with waitlist
                .collect(Collectors.toList());

        // More accurately: find all disponible=true future slots and match with waiting list
        List<TimeSlot> availableFutureSlots = slotRepo.findAll().stream()
                .filter(TimeSlot::isDisponible)
                .filter(s -> s.getDebut().isAfter(LocalDateTime.now()))
                .collect(Collectors.toList());

        if (availableFutureSlots.isEmpty()) {
            log.debug("No available future slots for waiting list processing.");
            return;
        }

        int matched = 0;
        for (TimeSlot slot : availableFutureSlots) {
            Optional<WaitingListEntry> candidate = waitingListRepo
                    .findFirstBySpecialiteIdOrMedecinIdOrderByPriorityDescDateAjoutAsc(
                            slot.getSpecialiteId(), slot.getMedecinId());

            if (candidate.isPresent()) {
                WaitingListEntry entry = candidate.get();
                try {
                    AppointmentRequest req = AppointmentRequest.builder()
                            .patientId(entry.getPatientId())
                            .medecinId(slot.getMedecinId())
                            .creneauId(slot.getId())
                            .motif(entry.getMotif())
                            .priority(entry.getPriority())
                            .patientNom(entry.getPatientNom())
                            .patientPrenom(entry.getPatientPrenom())
                            .medecinNom(slot.getMedecinNom())
                            .medecinPrenom(slot.getMedecinPrenom())
                            .specialiteId(slot.getSpecialiteId())
                            .build();

                    appointmentService.createAppointment(req);

                    // Mark as notified and remove from waiting list
                    entry.setNotifie(true);
                    waitingListRepo.save(entry);
                    waitingListRepo.delete(entry);

                    matched++;
                    log.info("Auto-matched waiting list entry {} with slot {}", entry.getId(), slot.getId());
                } catch (Exception ex) {
                    log.warn("Failed to auto-match waiting list entry {}: {}", entry.getId(), ex.getMessage());
                }
            }
        }

        if (matched > 0) {
            log.info("Waiting list processor: {} appointment(s) auto-created.", matched);
        }
    }
}
