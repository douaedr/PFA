package com.hospital.auth.config;

import com.hospital.auth.entity.UserAccount;
import com.hospital.auth.enums.Role;
import com.hospital.auth.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Crée les comptes par défaut au démarrage si la base est vide.
 * Comptes créés :
 *   admin@medsys.ma   / Admin1234!   (ADMIN)
 *   directeur@medsys.ma / Directeur1234! (DIRECTEUR)
 *   medecin@medsys.ma  / Medecin1234!  (MEDECIN)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final UserAccountRepository userRepo;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        createIfNotExists("admin@medsys.ma",     "Admin1234!",      "Admin",     "System",   Role.ADMIN,      "ADMIN001");
        createIfNotExists("directeur@medsys.ma", "Directeur1234!",  "Directeur", "Hopital",  Role.DIRECTEUR,  "DIR001");
        createIfNotExists("medecin@medsys.ma",   "Medecin1234!",    "Dupont",    "Jean",     Role.MEDECIN,    "MED001");
    }

    private void createIfNotExists(String email, String password,
                                   String nom, String prenom,
                                   Role role, String cin) {
        if (userRepo.existsByEmail(email)) return;

        UserAccount user = UserAccount.builder()
                .email(email)
                .password(passwordEncoder.encode(password))
                .nom(nom)
                .prenom(prenom)
                .cin(cin)
                .role(role)
                .enabled(true)
                .emailVerified(true)
                .failedLoginAttempts(0)
                .build();

        userRepo.save(user);
        log.info("[INIT] Compte {} créé : {} ({})", role, email, password);
    }
}
