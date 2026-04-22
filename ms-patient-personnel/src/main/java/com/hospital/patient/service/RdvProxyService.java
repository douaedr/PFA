package com.hospital.patient.service;

import com.hospital.patient.dto.RendezVousDTO;
import com.hospital.patient.entity.AppointmentRecord;
import com.hospital.patient.repository.AppointmentRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RdvProxyService {

    @Value("${ms-rdv.url:}")
    private String msRdvUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final AppointmentRecordRepository appointmentRepo;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    /**
     * Récupère les rendez-vous d'un patient.
     * Si ms-rdv.url n'est pas configuré, utilise les enregistrements locaux (sync RabbitMQ).
     */
    public List<RendezVousDTO> getRdvPatient(Long patientId) {
        if (msRdvUrl == null || msRdvUrl.isBlank()) {
            log.debug("ms-rdv.url non configuré, retour des données locales pour patient {}", patientId);
            return appointmentRepo.findByPatientIdOrderByAppointmentDateDesc(patientId)
                    .stream()
                    .map(this::toRendezVousDTO)
                    .collect(Collectors.toList());
        }

        try {
            String url = UriComponentsBuilder.fromHttpUrl(msRdvUrl)
                    .path("/api/v1/rdv/patient/{patientId}")
                    .buildAndExpand(patientId)
                    .toUriString();
            ResponseEntity<List<RendezVousDTO>> response = restTemplate.exchange(
                url, HttpMethod.GET, null, new ParameterizedTypeReference<>() {});
            return response.getBody() != null ? response.getBody() : List.of();
        } catch (Exception e) {
            log.warn("ms-rdv injoignable ({}), fallback local pour patient {}: {}", msRdvUrl, patientId, e.getMessage());
            return appointmentRepo.findByPatientIdOrderByAppointmentDateDesc(patientId)
                    .stream()
                    .map(this::toRendezVousDTO)
                    .collect(Collectors.toList());
        }
    }

    /**
     * Récupère tous les rendez-vous depuis le ms-rdv (vue directeur).
     */
    public List<RendezVousDTO> getAllRdv() {
        if (msRdvUrl == null || msRdvUrl.isBlank()) {
            return appointmentRepo.findAll()
                    .stream()
                    .map(this::toRendezVousDTO)
                    .collect(Collectors.toList());
        }
        try {
            String url = msRdvUrl + "/api/v1/rdv";
            ResponseEntity<List<RendezVousDTO>> response = restTemplate.exchange(
                url, HttpMethod.GET, null, new ParameterizedTypeReference<>() {});
            return response.getBody() != null ? response.getBody() : List.of();
        } catch (Exception e) {
            log.warn("Impossible de joindre ms-rdv (getAllRdv): {}", e.getMessage());
            return appointmentRepo.findAll()
                    .stream()
                    .map(this::toRendezVousDTO)
                    .collect(Collectors.toList());
        }
    }

    /**
     * Annule un rendez-vous.
     * Si ms-rdv n'est pas disponible, met à jour le statut local.
     */
    public boolean annulerRdv(Long rdvId, Long patientId) {
        if (msRdvUrl == null || msRdvUrl.isBlank()) {
            return annulerLocal(rdvId, patientId);
        }
        try {
            String url = UriComponentsBuilder.fromHttpUrl(msRdvUrl)
                    .path("/api/v1/rdv/{rdvId}/annuler")
                    .queryParam("patientId", patientId)
                    .buildAndExpand(rdvId)
                    .toUriString();
            restTemplate.put(url, null);
            annulerLocal(rdvId, patientId);
            return true;
        } catch (Exception e) {
            log.warn("Impossible d'annuler RDV {} via ms-rdv, annulation locale: {}", rdvId, e.getMessage());
            return annulerLocal(rdvId, patientId);
        }
    }

    private boolean annulerLocal(Long rdvId, Long patientId) {
        return appointmentRepo.findById(rdvId)
                .filter(r -> r.getPatientId().equals(patientId))
                .map(r -> {
                    r.setStatus("CANCELLED");
                    r.setUpdatedAt(LocalDateTime.now());
                    appointmentRepo.save(r);
                    log.info("RDV {} annulé localement pour patient {}", rdvId, patientId);
                    return true;
                })
                .orElse(false);
    }

    private RendezVousDTO toRendezVousDTO(AppointmentRecord r) {
        String date = r.getAppointmentDate() != null
                ? r.getAppointmentDate().format(DATE_FMT) : null;
        String heure = r.getAppointmentDate() != null
                ? r.getAppointmentDate().format(TIME_FMT) : null;

        String statut = switch (r.getStatus() != null ? r.getStatus() : "") {
            case "SCHEDULED"  -> "EN_ATTENTE";
            case "COMPLETED"  -> "TERMINE";
            case "CANCELLED"  -> "ANNULE";
            case "CONFIRMED"  -> "CONFIRME";
            default           -> "EN_ATTENTE";
        };

        return RendezVousDTO.builder()
                .id(r.getId())
                .date(date)
                .heure(heure)
                .motif(r.getNotes())
                .statut(statut)
                .medecinNom(r.getDoctorName())
                .medecinSpecialite(r.getSpecialty())
                .notes(r.getNotes())
                .build();
    }
}
