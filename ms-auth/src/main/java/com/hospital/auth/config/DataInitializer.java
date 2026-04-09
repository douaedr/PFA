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
 * Crée les comptes par défaut au démarrage si absents.
 *
 * PERSONNEL HOSPITALIER — connexion sur /login/personnel :
 *   admin@medsys.ma          / Admin1234!        (ADMIN)
 *   directeur@medsys.ma      / Directeur1234!    (DIRECTEUR)
 *   medecin@medsys.ma        / Medecin1234!      (MEDECIN)
 *   secretaire@medsys.ma     / Secretaire1234!   (SECRETARY — secrétaire médicale)
 *   infirmier@medsys.ma      / Infirmier1234!    (PERSONNEL — infirmier/ière)
 *   aidesoignant@medsys.ma   / Aide1234!         (PERSONNEL — aide soignant)
 *   brancardier@medsys.ma    / Brancard1234!     (PERSONNEL — brancardier)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final UserAccountRepository userRepo;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        // Comptes administration
        createIfNotExists("admin@medsys.ma",         "Admin1234!",      "Admin",      "System",    Role.ADMIN,      "ADMIN001");
        createIfNotExists("directeur@medsys.ma",     "Directeur1234!",  "Directeur",  "Hopital",   Role.DIRECTEUR,  "DIR001");
        // Médecin
        createIfNotExists("medecin@medsys.ma",       "Medecin1234!",    "Dupont",     "Jean",      Role.MEDECIN,    "MED001");
        // Personnel paramédical (rôle SECRETARY = secrétaire médicale)
        createIfNotExists("secretaire@medsys.ma",    "Secretaire1234!", "Alami",      "Fatima",    Role.SECRETARY,  "SEC001");
        // Personnel paramédical (rôle PERSONNEL = infirmier, aide soignant, brancardier)
        createIfNotExists("infirmier@medsys.ma",     "Infirmier1234!",  "Benali",     "Youssef",   Role.PERSONNEL,  "INF001");
        createIfNotExists("aidesoignant@medsys.ma",  "Aide1234!",       "Chraibi",    "Aicha",     Role.PERSONNEL,  "AID001");
        createIfNotExists("brancardier@medsys.ma",   "Brancard1234!",   "Fassi",      "Omar",      Role.PERSONNEL,  "BRA001");
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
