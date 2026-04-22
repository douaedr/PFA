package com.hospital.patient.service;

import com.hospital.patient.dto.BlockedSlotDTO;
import com.hospital.patient.dto.CreateBlockedSlotRequest;
import com.hospital.patient.entity.BlockedSlot;
import com.hospital.patient.repository.BlockedSlotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class BlockedSlotService {

    private final BlockedSlotRepository repo;

    public BlockedSlotDTO bloquer(Long secretaireId, String secretaireNom,
                                  Long doctorId, String doctorName,
                                  CreateBlockedSlotRequest req) {
        if (req.getEndTime().isBefore(req.getStartTime()) ||
            req.getEndTime().equals(req.getStartTime())) {
            throw new IllegalArgumentException("L'heure de fin doit être postérieure à l'heure de début");
        }
        if (req.getSlotDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Impossible de bloquer un créneau dans le passé");
        }

        BlockedSlot slot = BlockedSlot.builder()
                .doctorId(doctorId)
                .doctorName(doctorName)
                .slotDate(req.getSlotDate())
                .startTime(req.getStartTime())
                .endTime(req.getEndTime())
                .raison(req.getRaison())
                .secretaireId(secretaireId)
                .secretaireNom(secretaireNom)
                .actif(true)
                .build();

        slot = repo.save(slot);
        log.info("[BLOCKED_SLOT] Secrétaire {} a bloqué le créneau du {} de {} à {} pour Dr. {}",
                secretaireNom, req.getSlotDate(), req.getStartTime(), req.getEndTime(), doctorName);
        return toDTO(slot);
    }

    @Transactional(readOnly = true)
    public List<BlockedSlotDTO> getSlotsForDoctor(Long doctorId) {
        return repo.findByDoctorIdAndActifTrueOrderBySlotDateAscStartTimeAsc(doctorId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BlockedSlotDTO> getSlotsForSecretaire(Long secretaireId) {
        return repo.findBySecretaireIdOrderByCreatedAtDesc(secretaireId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BlockedSlotDTO> getSlotsForDoctorAndWeek(Long doctorId, LocalDate weekStart) {
        LocalDate weekEnd = weekStart.plusDays(6);
        return repo.findByDoctorIdAndSlotDateBetweenAndActifTrue(doctorId, weekStart, weekEnd)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public void supprimer(Long slotId, Long secretaireId) {
        BlockedSlot slot = repo.findById(slotId)
                .orElseThrow(() -> new RuntimeException("Créneau bloqué introuvable: " + slotId));
        if (!slot.getSecretaireId().equals(secretaireId)) {
            throw new IllegalStateException("Ce créneau n'a pas été créé par cette secrétaire");
        }
        slot.setActif(false);
        repo.save(slot);
        log.info("[BLOCKED_SLOT] Créneau {} désactivé par secrétaire {}", slotId, secretaireId);
    }

    private BlockedSlotDTO toDTO(BlockedSlot s) {
        return BlockedSlotDTO.builder()
                .id(s.getId())
                .doctorId(s.getDoctorId())
                .doctorName(s.getDoctorName())
                .slotDate(s.getSlotDate())
                .startTime(s.getStartTime())
                .endTime(s.getEndTime())
                .raison(s.getRaison())
                .secretaireId(s.getSecretaireId())
                .secretaireNom(s.getSecretaireNom())
                .actif(s.isActif())
                .createdAt(s.getCreatedAt())
                .build();
    }
}
