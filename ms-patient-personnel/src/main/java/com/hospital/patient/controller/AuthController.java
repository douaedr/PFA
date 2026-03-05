package com.hospital.patient.controller;

import com.hospital.patient.dto.auth.LoginRequest;
import com.hospital.patient.dto.auth.LoginResponse;
import com.hospital.patient.entity.Patient;
import com.hospital.patient.repository.PatientRepository;
import com.hospital.patient.security.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final PatientRepository patientRepository;
    private final JwtService jwtService;

    /**
     * POST /api/v1/auth/login
     * Connexion patient par CIN + date de naissance
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {

        // 1. Chercher le patient par CIN
        Patient patient = patientRepository.findByCin(request.getCin().toUpperCase())
                .orElse(null);

        if (patient == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "CIN introuvable. Vérifiez votre numéro."));
        }

        // 2. Vérifier la date de naissance
        if (!patient.getDateNaissance().equals(request.getDateNaissance())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Date de naissance incorrecte."));
        }

        // 3. Générer le token JWT
        String token = jwtService.generateToken(patient.getId(), patient.getCin());

        // 4. Retourner le token + infos patient
        LoginResponse response = LoginResponse.builder()
                .token(token)
                .type("Bearer")
                .patientId(patient.getId())
                .cin(patient.getCin())
                .nom(patient.getNom())
                .prenom(patient.getPrenom())
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v1/auth/verify
     * Vérifier si le token est encore valide
     */
    @GetMapping("/verify")
    public ResponseEntity<?> verify(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("valid", false));
        }
        String token = authHeader.substring(7);
        boolean valid = jwtService.isTokenValid(token);
        return ResponseEntity.ok(Map.of("valid", valid));
    }
}
