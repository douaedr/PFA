package com.hospital.patient.service;

import com.hospital.patient.dto.RendezVousDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;

@Slf4j
@Service
public class RdvProxyService {

    @Value("${ms-rdv.url:}")
    private String msRdvUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Récupère les rendez-vous d'un patient depuis le ms-rdv.
     * Retourne une liste vide si ms-rdv n'est pas configuré ou injoignable.
     */
    public List<RendezVousDTO> getRdvPatient(Long patientId) {
        if (msRdvUrl == null || msRdvUrl.isBlank()) {
            log.debug("ms-rdv.url non configuré, retour liste vide");
            return List.of();
        }

        try {
            String url = UriComponentsBuilder.fromHttpUrl(msRdvUrl)
                    .path("/api/v1/rdv/patient/{patientId}")
                    .buildAndExpand(patientId)
                    .toUriString();
            ResponseEntity<List<RendezVousDTO>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<>() {}
            );
            return response.getBody() != null ? response.getBody() : List.of();
        } catch (Exception e) {
            log.warn("Impossible de joindre ms-rdv ({}): {}", msRdvUrl, e.getMessage());
            return List.of();
        }
    }

    /**
     * Récupère tous les rendez-vous depuis le ms-rdv (vue directeur).
     */
    public List<RendezVousDTO> getAllRdv() {
        if (msRdvUrl == null || msRdvUrl.isBlank()) return List.of();
        try {
            String url = msRdvUrl + "/api/v1/rdv";
            ResponseEntity<List<RendezVousDTO>> response = restTemplate.exchange(
                url, HttpMethod.GET, null, new ParameterizedTypeReference<>() {});
            return response.getBody() != null ? response.getBody() : List.of();
        } catch (Exception e) {
            log.warn("Impossible de joindre ms-rdv (getAllRdv): {}", e.getMessage());
            return List.of();
        }
    }

    /**
     * Annule un rendez-vous via le ms-rdv.
     */
    public boolean annulerRdv(Long rdvId, Long patientId) {
        if (msRdvUrl == null || msRdvUrl.isBlank()) return false;
        try {
            String url = UriComponentsBuilder.fromHttpUrl(msRdvUrl)
                    .path("/api/v1/rdv/{rdvId}/annuler")
                    .queryParam("patientId", patientId)
                    .buildAndExpand(rdvId)
                    .toUriString();
            restTemplate.put(url, null);
            return true;
        } catch (Exception e) {
            log.warn("Impossible d'annuler RDV {} via ms-rdv: {}", rdvId, e.getMessage());
            return false;
        }
    }
}
