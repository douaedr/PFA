package com.hospital.patient.controller;

import com.hospital.patient.dto.PatientResponseDTO;
import com.hospital.patient.entity.Patient;
import com.hospital.patient.exception.PatientNotFoundException;
import com.hospital.patient.mapper.PatientMapper;
import com.hospital.patient.repository.PatientRepository;
import com.hospital.patient.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/patient")
@RequiredArgsConstructor
public class PatientPortalController {

    private final PatientRepository patientRepository;
    private final PatientMapper patientMapper;
    private final JwtService jwtService;

    /**
     * GET /api/v1/patient/me
     * Retourne les infos du patient connecté (via son token JWT)
     */
    @GetMapping("/me")
    public ResponseEntity<PatientResponseDTO> getMyProfile(
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.substring(7);
        Long patientId = jwtService.extractPatientId(token);

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new PatientNotFoundException("Patient non trouvé"));

        return ResponseEntity.ok(patientMapper.toResponseDTO(patient));
    }
}
