package com.hospital.patient.service;

import com.hospital.patient.dto.RendezVousDTO;
import com.hospital.patient.entity.AppointmentRecord;
import com.hospital.patient.repository.AppointmentRecordRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RdvProxyServiceTest {

    @Mock
    private AppointmentRecordRepository appointmentRepo;

    private RdvProxyService service;

    @BeforeEach
    void setUp() {
        service = new RdvProxyService(appointmentRepo);
        // msRdvUrl left blank → forces local fallback
        ReflectionTestUtils.setField(service, "msRdvUrl", "");
    }

    private AppointmentRecord makeRecord(Long id, Long patientId, String status) {
        return AppointmentRecord.builder()
                .id(id).externalAppointmentId(id * 100)
                .patientId(patientId).doctorId(1L)
                .doctorName("Dr. Dupont").specialty("Cardio")
                .appointmentDate(LocalDateTime.now().plusDays(3))
                .status(status).notes("Contrôle annuel")
                .build();
    }

    @Test
    void getRdvPatient_noExternalService_returnsLocalRecords() {
        when(appointmentRepo.findByPatientIdOrderByAppointmentDateDesc(5L))
                .thenReturn(List.of(makeRecord(1L, 5L, "SCHEDULED"), makeRecord(2L, 5L, "COMPLETED")));

        List<RendezVousDTO> result = service.getRdvPatient(5L);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getMedecinNom()).isEqualTo("Dr. Dupont");
        assertThat(result.get(0).getStatut()).isEqualTo("EN_ATTENTE");
        assertThat(result.get(1).getStatut()).isEqualTo("TERMINE");
    }

    @Test
    void getRdvPatient_mapsStatusCorrectly() {
        when(appointmentRepo.findByPatientIdOrderByAppointmentDateDesc(5L))
                .thenReturn(List.of(
                        makeRecord(1L, 5L, "SCHEDULED"),
                        makeRecord(2L, 5L, "COMPLETED"),
                        makeRecord(3L, 5L, "CANCELLED"),
                        makeRecord(4L, 5L, "CONFIRMED")
                ));

        List<RendezVousDTO> result = service.getRdvPatient(5L);

        assertThat(result).extracting(RendezVousDTO::getStatut)
                .containsExactly("EN_ATTENTE", "TERMINE", "ANNULE", "CONFIRME");
    }

    @Test
    void annulerRdv_noExternalService_updatesLocalRecord() {
        AppointmentRecord record = makeRecord(7L, 5L, "SCHEDULED");

        when(appointmentRepo.findById(7L)).thenReturn(Optional.of(record));
        when(appointmentRepo.save(any())).thenReturn(record);

        boolean result = service.annulerRdv(7L, 5L);

        assertThat(result).isTrue();
        assertThat(record.getStatus()).isEqualTo("CANCELLED");
        verify(appointmentRepo).save(record);
    }

    @Test
    void annulerRdv_wrongPatient_returnsFalse() {
        AppointmentRecord record = makeRecord(7L, 99L, "SCHEDULED"); // belongs to patient 99

        when(appointmentRepo.findById(7L)).thenReturn(Optional.of(record));

        boolean result = service.annulerRdv(7L, 5L); // patient 5 trying to cancel

        assertThat(result).isFalse();
        verify(appointmentRepo, never()).save(any());
    }

    @Test
    void annulerRdv_notFound_returnsFalse() {
        when(appointmentRepo.findById(999L)).thenReturn(Optional.empty());

        boolean result = service.annulerRdv(999L, 5L);

        assertThat(result).isFalse();
    }
}
