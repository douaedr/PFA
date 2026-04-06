package ma.medsys.rdv.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.medsys.rdv.dto.TimeSlotRequest;
import ma.medsys.rdv.dto.TimeSlotResponse;
import ma.medsys.rdv.entity.TimeSlot;
import ma.medsys.rdv.enums.SlotType;
import ma.medsys.rdv.repository.AppointmentRepository;
import ma.medsys.rdv.repository.TimeSlotRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TimeSlotService {

    private final TimeSlotRepository slotRepo;
    private final AppointmentRepository appointmentRepo;

    @Transactional
    public TimeSlotResponse createSlot(TimeSlotRequest req) {
        SlotType type = req.getType() != null ? req.getType() : SlotType.CONSULTATION;
        int duration = req.getDureeMinutes() > 0 ? req.getDureeMinutes() : 30;

        TimeSlot slot = TimeSlot.builder()
                .medecinId(req.getMedecinId())
                .medecinNom(req.getMedecinNom())
                .medecinPrenom(req.getMedecinPrenom())
                .specialiteId(req.getSpecialiteId())
                .debut(req.getDebut())
                .fin(req.getFin())
                .disponible(true)
                .dureeMinutes(duration)
                .type(type)
                .build();

        slot = slotRepo.save(slot);
        log.info("TimeSlot created: id={}, medecinId={}, debut={}", slot.getId(), slot.getMedecinId(), slot.getDebut());
        return toResponse(slot);
    }

    public List<TimeSlotResponse> getAvailableByMedecin(Long medecinId) {
        return slotRepo.findByMedecinIdAndDisponibleTrue(medecinId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<TimeSlotResponse> getAvailableBySpecialite(Long specialiteId, LocalDateTime from, LocalDateTime to) {
        return slotRepo.findBySpecialiteIdAndDisponibleTrueAndDebutBetween(specialiteId, from, to).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteSlot(Long id) {
        TimeSlot slot = slotRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Créneau introuvable: " + id));

        if (!slot.isDisponible()) {
            throw new IllegalStateException("Impossible de supprimer un créneau déjà réservé.");
        }

        slotRepo.delete(slot);
        log.info("TimeSlot deleted: id={}", id);
    }

    public TimeSlotResponse toResponse(TimeSlot s) {
        return TimeSlotResponse.builder()
                .id(s.getId())
                .medecinId(s.getMedecinId())
                .medecinNom(s.getMedecinNom())
                .medecinPrenom(s.getMedecinPrenom())
                .specialiteId(s.getSpecialiteId())
                .debut(s.getDebut())
                .fin(s.getFin())
                .disponible(s.isDisponible())
                .dureeMinutes(s.getDureeMinutes())
                .type(s.getType())
                .createdAt(s.getCreatedAt())
                .build();
    }
}
