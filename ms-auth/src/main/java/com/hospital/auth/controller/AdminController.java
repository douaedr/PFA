package com.hospital.auth.controller;

import com.hospital.auth.dto.AuthResponse;
import com.hospital.auth.dto.CreatePersonnelRequest;
import com.hospital.auth.entity.UserAccount;
import com.hospital.auth.enums.Role;
import com.hospital.auth.repository.UserAccountRepository;
import com.hospital.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AuthService authService;
    private final UserAccountRepository userRepo;

    // POST /api/v1/admin/personnel  → Créer compte médecin/personnel
    @PostMapping("/personnel")
    public ResponseEntity<AuthResponse> createPersonnel(@Valid @RequestBody CreatePersonnelRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.createPersonnelAccount(req));
    }

    // GET /api/v1/admin/users  → Lister tous les comptes
    @GetMapping("/users")
    public ResponseEntity<List<UserAccount>> listUsers() {
        return ResponseEntity.ok(userRepo.findAll());
    }

    // GET /api/v1/admin/users/role/{role}
    @GetMapping("/users/role/{role}")
    public ResponseEntity<List<UserAccount>> listByRole(@PathVariable Role role) {
        return ResponseEntity.ok(userRepo.findByRole(role));
    }

    // PUT /api/v1/admin/users/{id}/toggle  → Activer/Désactiver
    @PutMapping("/users/{id}/toggle")
    public ResponseEntity<Map<String, String>> toggleUser(@PathVariable Long id) {
        UserAccount user = userRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        user.setEnabled(!user.isEnabled());
        userRepo.save(user);
        return ResponseEntity.ok(Map.of(
            "message", user.isEnabled() ? "Compte activé" : "Compte désactivé",
            "enabled", String.valueOf(user.isEnabled())
        ));
    }

    // DELETE /api/v1/admin/users/{id}
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
