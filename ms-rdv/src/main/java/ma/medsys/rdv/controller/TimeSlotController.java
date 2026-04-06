package ma.medsys.rdv.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import ma.medsys.rdv.dto.SlotRecommendation;
import ma.medsys.rdv.dto.TimeSlotRequest;
import ma.medsys.rdv.dto.TimeSlotResponse;
import ma.medsys.rdv.enums.AppointmentPriority;
import ma.medsys.rdv.service.SlotRecommendationService;
import ma.medsys.rdv.service.TimeSlotService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/rdv/creneaux")
@RequiredArgsConstructor
@Tag(name = "Time Slots", description = "Doctor time slot management")
public class TimeSlotController {

    private final TimeSlotService timeSlotService;
    private final SlotRecommendationService recommendationService;

    /**
     * Public endpoint: list available slots.
     * Supports filtering by medecinId, specialiteId, from, and to.
     */
    @GetMapping
    @Operation(summary = "List available time slots (public)")
    public ResponseEntity<List<TimeSlotResponse>> getAvailable(
            @RequestParam(required = false) Long medecinId,
            @RequestParam(required = false) Long specialiteId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {

        if (medecinId != null && specialiteId == null) {
            return ResponseEntity.ok(timeSlotService.getAvailableByMedecin(medecinId));
        }

        if (specialiteId != null) {
            LocalDateTime rangeFrom = from != null ? from : LocalDateTime.now();
            LocalDateTime rangeTo = to != null ? to : rangeFrom.plusDays(30);
            return ResponseEntity.ok(timeSlotService.getAvailableBySpecialite(specialiteId, rangeFrom, rangeTo));
        }

        // Default: no filter — return empty list to avoid full table scan
        return ResponseEntity.ok(List.of());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MEDECIN','ADMIN')")
    @Operation(summary = "Create a time slot")
    public ResponseEntity<TimeSlotResponse> createSlot(@RequestBody TimeSlotRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(timeSlotService.createSlot(req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MEDECIN','ADMIN')")
    @Operation(summary = "Delete an unbooked time slot")
    public ResponseEntity<Void> deleteSlot(@PathVariable Long id) {
        timeSlotService.deleteSlot(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/recommend")
    @Operation(summary = "Get recommended time slots for a patient")
    public ResponseEntity<List<SlotRecommendation>> recommend(
            @RequestParam Long patientId,
            @RequestParam Long specialiteId,
            @RequestParam(defaultValue = "NORMAL") AppointmentPriority priority) {
        return ResponseEntity.ok(recommendationService.recommend(patientId, specialiteId, priority));
    }

    @ExceptionHandler(java.util.NoSuchElementException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(java.util.NoSuchElementException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleIllegalState(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", ex.getMessage()));
    }
}
