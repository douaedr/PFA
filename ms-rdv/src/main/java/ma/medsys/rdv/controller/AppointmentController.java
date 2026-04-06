package ma.medsys.rdv.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import ma.medsys.rdv.dto.AppointmentRequest;
import ma.medsys.rdv.dto.AppointmentResponse;
import ma.medsys.rdv.service.AppointmentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/rdv/appointments")
@RequiredArgsConstructor
@Tag(name = "Appointments", description = "Appointment management endpoints")
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping
    @PreAuthorize("hasAnyRole('PATIENT','MEDECIN','ADMIN')")
    @Operation(summary = "Create a new appointment")
    public ResponseEntity<AppointmentResponse> createAppointment(@RequestBody AppointmentRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(appointmentService.createAppointment(req));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get appointment by ID")
    public ResponseEntity<AppointmentResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.getById(id));
    }

    @GetMapping("/patient/{patientId}")
    @Operation(summary = "Get all appointments for a patient")
    public ResponseEntity<List<AppointmentResponse>> getByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(appointmentService.getByPatientId(patientId));
    }

    @GetMapping("/medecin/{medecinId}")
    @Operation(summary = "Get all appointments for a doctor")
    public ResponseEntity<List<AppointmentResponse>> getByMedecin(@PathVariable Long medecinId) {
        return ResponseEntity.ok(appointmentService.getByMedecinId(medecinId));
    }

    @PatchMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('MEDECIN','ADMIN')")
    @Operation(summary = "Confirm an appointment")
    public ResponseEntity<AppointmentResponse> confirm(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.confirm(id));
    }

    @PatchMapping("/{id}/cancel")
    @Operation(summary = "Cancel an appointment")
    public ResponseEntity<AppointmentResponse> cancel(
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {
        return ResponseEntity.ok(appointmentService.cancel(id, reason));
    }

    @PatchMapping("/{id}/noshow")
    @PreAuthorize("hasAnyRole('MEDECIN','ADMIN')")
    @Operation(summary = "Mark appointment as no-show")
    public ResponseEntity<AppointmentResponse> markNoShow(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.markNoShow(id));
    }

    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasRole('MEDECIN')")
    @Operation(summary = "Mark appointment as completed")
    public ResponseEntity<AppointmentResponse> complete(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.complete(id));
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
