package ma.medsys.rdv.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import ma.medsys.rdv.dto.WaitlistRequest;
import ma.medsys.rdv.entity.WaitingListEntry;
import ma.medsys.rdv.service.WaitingListService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/rdv/waitlist")
@RequiredArgsConstructor
@Tag(name = "Waiting List", description = "Patient waiting list management")
public class WaitingListController {

    private final WaitingListService waitingListService;

    @PostMapping
    @Operation(summary = "Add a patient to the waiting list")
    public ResponseEntity<WaitingListEntry> addToWaitlist(@RequestBody WaitlistRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(waitingListService.addToWaitlist(req));
    }

    @GetMapping("/patient/{patientId}")
    @Operation(summary = "Get waiting list entries for a patient")
    public ResponseEntity<List<WaitingListEntry>> getByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(waitingListService.getByPatientId(patientId));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Remove a patient from the waiting list")
    public ResponseEntity<Void> remove(@PathVariable Long id) {
        waitingListService.removeFromWaitlist(id);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(java.util.NoSuchElementException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(java.util.NoSuchElementException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
    }
}
