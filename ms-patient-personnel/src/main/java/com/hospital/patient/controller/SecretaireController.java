package com.hospital.patient.controller;

import com.hospital.patient.dto.BlockedSlotDTO;
import com.hospital.patient.dto.CreateBlockedSlotRequest;
import com.hospital.patient.security.JwtService;
import com.hospital.patient.service.BlockedSlotService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/secretaire")
@RequiredArgsConstructor
public class SecretaireController {

    private final BlockedSlotService blockedSlotService;
    private final JwtService jwtService;

    // ─── Bloquer un créneau pour le médecin assigné ───────────────────────────

    @PostMapping("/slots/bloquer")
    public ResponseEntity<?> bloquerCreneau(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String doctorName,
            @Valid @RequestBody CreateBlockedSlotRequest req) {

        String token = authHeader.substring(7);
        if (!"SECRETARY".equals(jwtService.extractRole(token))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Accès réservé aux secrétaires médicales"));
        }

        Long secretaireId = jwtService.extractUserId(token);
        String secretaireNom = jwtService.extractNom(token);
        Long medecinId = jwtService.extractMedecinAssigneId(token);

        if (medecinId == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Aucun médecin assigné à ce compte secrétaire. Contactez l'administrateur."));
        }

        try {
            BlockedSlotDTO dto = blockedSlotService.bloquer(
                    secretaireId, secretaireNom, medecinId,
                    doctorName != null ? doctorName : "Dr. " + medecinId,
                    req);
            return ResponseEntity.status(HttpStatus.CREATED).body(dto);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ─── Lister les créneaux bloqués du médecin assigné ──────────────────────

    @GetMapping("/slots")
    public ResponseEntity<?> listerCreneaux(
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.substring(7);
        if (!"SECRETARY".equals(jwtService.extractRole(token))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Accès réservé aux secrétaires médicales"));
        }

        Long medecinId = jwtService.extractMedecinAssigneId(token);
        if (medecinId == null) {
            return ResponseEntity.ok(List.of());
        }

        List<BlockedSlotDTO> slots = blockedSlotService.getSlotsForDoctor(medecinId);
        return ResponseEntity.ok(slots);
    }

    // ─── Lister les créneaux de la semaine du médecin assigné ────────────────

    @GetMapping("/slots/semaine")
    public ResponseEntity<?> listerCreneauxSemaine(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String dateDebut) {

        String token = authHeader.substring(7);
        if (!"SECRETARY".equals(jwtService.extractRole(token))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Accès réservé aux secrétaires médicales"));
        }

        Long medecinId = jwtService.extractMedecinAssigneId(token);
        if (medecinId == null) return ResponseEntity.ok(List.of());

        LocalDate weekStart = dateDebut != null
                ? LocalDate.parse(dateDebut)
                : LocalDate.now().with(java.time.DayOfWeek.MONDAY);

        return ResponseEntity.ok(blockedSlotService.getSlotsForDoctorAndWeek(medecinId, weekStart));
    }

    // ─── Supprimer / désactiver un créneau bloqué ────────────────────────────

    @DeleteMapping("/slots/{id}")
    public ResponseEntity<?> supprimerCreneau(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {

        String token = authHeader.substring(7);
        if (!"SECRETARY".equals(jwtService.extractRole(token))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Accès réservé aux secrétaires médicales"));
        }

        Long secretaireId = jwtService.extractUserId(token);
        try {
            blockedSlotService.supprimer(id, secretaireId);
            return ResponseEntity.ok(Map.of("message", "Créneau débloqué avec succès"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ─── Infos secrétaire (médecin assigné) ──────────────────────────────────

    @GetMapping("/info")
    public ResponseEntity<?> getInfo(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        if (!"SECRETARY".equals(jwtService.extractRole(token))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Accès réservé aux secrétaires médicales"));
        }
        Long medecinId = jwtService.extractMedecinAssigneId(token);
        return ResponseEntity.ok(Map.of(
                "secretaireId", jwtService.extractUserId(token),
                "secretaireNom", jwtService.extractNom(token),
                "medecinAssigneId", medecinId != null ? medecinId : 0
        ));
    }
}
