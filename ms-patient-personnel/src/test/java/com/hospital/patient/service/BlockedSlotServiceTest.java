package com.hospital.patient.service;

import com.hospital.patient.dto.BlockedSlotDTO;
import com.hospital.patient.dto.CreateBlockedSlotRequest;
import com.hospital.patient.entity.BlockedSlot;
import com.hospital.patient.repository.BlockedSlotRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BlockedSlotServiceTest {

    @Mock
    private BlockedSlotRepository repo;

    @InjectMocks
    private BlockedSlotService service;

    private CreateBlockedSlotRequest validRequest;

    @BeforeEach
    void setUp() {
        validRequest = new CreateBlockedSlotRequest(
                LocalDate.now().plusDays(1),
                LocalTime.of(9, 0),
                LocalTime.of(10, 0),
                "Congé"
        );
    }

    @Test
    void bloquer_shouldSaveAndReturnDTO() {
        BlockedSlot saved = BlockedSlot.builder()
                .id(1L).doctorId(42L).doctorName("Dr. Dupont")
                .slotDate(validRequest.getSlotDate())
                .startTime(validRequest.getStartTime())
                .endTime(validRequest.getEndTime())
                .raison(validRequest.getRaison())
                .secretaireId(10L).secretaireNom("Alami Fatima").actif(true)
                .build();

        when(repo.save(any())).thenReturn(saved);

        BlockedSlotDTO dto = service.bloquer(10L, "Alami Fatima", 42L, "Dr. Dupont", validRequest);

        assertThat(dto.getDoctorId()).isEqualTo(42L);
        assertThat(dto.getSlotDate()).isEqualTo(validRequest.getSlotDate());
        assertThat(dto.getStartTime()).isEqualTo(LocalTime.of(9, 0));
        assertThat(dto.getEndTime()).isEqualTo(LocalTime.of(10, 0));
        assertThat(dto.getRaison()).isEqualTo("Congé");
        verify(repo).save(any(BlockedSlot.class));
    }

    @Test
    void bloquer_shouldRejectPastDate() {
        validRequest.setSlotDate(LocalDate.now().minusDays(1));
        assertThatThrownBy(() ->
            service.bloquer(10L, "Alami Fatima", 42L, "Dr. Dupont", validRequest)
        ).isInstanceOf(IllegalArgumentException.class)
         .hasMessageContaining("passé");
    }

    @Test
    void bloquer_shouldRejectEndBeforeStart() {
        validRequest.setStartTime(LocalTime.of(10, 0));
        validRequest.setEndTime(LocalTime.of(9, 0));
        assertThatThrownBy(() ->
            service.bloquer(10L, "Alami Fatima", 42L, "Dr. Dupont", validRequest)
        ).isInstanceOf(IllegalArgumentException.class)
         .hasMessageContaining("postérieure");
    }

    @Test
    void bloquer_shouldRejectEndEqualToStart() {
        validRequest.setStartTime(LocalTime.of(9, 0));
        validRequest.setEndTime(LocalTime.of(9, 0));
        assertThatThrownBy(() ->
            service.bloquer(10L, "Alami Fatima", 42L, "Dr. Dupont", validRequest)
        ).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void getSlotsForDoctor_shouldReturnActiveSlotsOnly() {
        BlockedSlot slot = BlockedSlot.builder().id(5L).doctorId(42L).actif(true)
                .slotDate(LocalDate.now().plusDays(2))
                .startTime(LocalTime.of(14, 0)).endTime(LocalTime.of(15, 0))
                .secretaireId(10L).build();

        when(repo.findByDoctorIdAndActifTrueOrderBySlotDateAscStartTimeAsc(42L))
                .thenReturn(List.of(slot));

        List<BlockedSlotDTO> result = service.getSlotsForDoctor(42L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(5L);
    }

    @Test
    void supprimer_shouldDeactivateSlot() {
        BlockedSlot slot = BlockedSlot.builder()
                .id(5L).secretaireId(10L).actif(true)
                .doctorId(42L).slotDate(LocalDate.now().plusDays(1))
                .startTime(LocalTime.of(9, 0)).endTime(LocalTime.of(10, 0))
                .build();

        when(repo.findById(5L)).thenReturn(Optional.of(slot));
        when(repo.save(any())).thenReturn(slot);

        service.supprimer(5L, 10L);

        assertThat(slot.isActif()).isFalse();
        verify(repo).save(slot);
    }

    @Test
    void supprimer_shouldRejectWrongSecretaire() {
        BlockedSlot slot = BlockedSlot.builder()
                .id(5L).secretaireId(99L).actif(true)
                .doctorId(42L).slotDate(LocalDate.now().plusDays(1))
                .startTime(LocalTime.of(9, 0)).endTime(LocalTime.of(10, 0))
                .build();

        when(repo.findById(5L)).thenReturn(Optional.of(slot));

        assertThatThrownBy(() -> service.supprimer(5L, 10L))
                .isInstanceOf(IllegalStateException.class);
    }
}
