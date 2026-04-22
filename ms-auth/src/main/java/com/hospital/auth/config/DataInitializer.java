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
 *   medecin2@medsys.ma       / Medecin2_1234!    (MEDECIN — 2e médecin)
 *   secretaire@medsys.ma     / Secretaire1234!   (SECRETARY — assignée au médecin 1)
 *   infirmier@medsys.ma      / Infirmier1234!    (PERSONNEL — infirmier/ière)
 *   aidesoignant@medsys.ma   / Aide1234!         (PERSONNEL — aide soignant)
 *   brancardier@medsys.ma    / Brancard1234!     (PERSONNEL — brancardier)
 *
 * ESPACE PATIENT — connexion sur /patient :
 *   patient@medsys.ma        / Patient1234!      (PATIENT)
 *   patient2@medsys.ma       / Patient2_1234!    (PATIENT — 2e patient de test)
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
        createIfNotExists("admin@medsys.ma",         "Admin1234!",       "Admin",      "System",    Role.ADMIN,      "ADMIN001", null);
        createIfNotExists("directeur@medsys.ma",     "Directeur1234!",   "Directeur",  "Hopital",   Role.DIRECTEUR,  "DIR001",   null);

        // Médecins (créés avant la secrétaire pour récupérer leur ID)
        UserAccount med1 = createIfNotExists("medecin@medsys.ma",  "Medecin1234!",   "Dupont",  "Jean",   Role.MEDECIN, "MED001", null);
        createIfNotExists("medecin2@medsys.ma", "Medecin2_1234!", "Martin", "Sophie", Role.MEDECIN, "MED002", null);

        // Secrétaire — assignée au médecin 1
        Long medecinAssigneId = med1 != null ? med1.getId() : null;
        createIfNotExists("secretaire@medsys.ma", "Secretaire1234!", "Alami", "Fatima", Role.SECRETARY, "SEC001", medecinAssigneId);

        // Personnel paramédical
        createIfNotExists("infirmier@medsys.ma",    "Infirmier1234!", "Benali",  "Youssef", Role.PERSONNEL, "INF001", null);
        createIfNotExists("aidesoignant@medsys.ma", "Aide1234!",      "Chraibi", "Aicha",   Role.PERSONNEL, "AID001", null);
        createIfNotExists("brancardier@medsys.ma",  "Brancard1234!",  "Fassi",   "Omar",    Role.PERSONNEL, "BRA001", null);

        // Comptes patients de test
        createIfNotExists("patient@medsys.ma",  "Patient1234!",   "Benali",   "Karim",   Role.PATIENT, "PAT001", null);
        createIfNotExists("patient2@medsys.ma", "Patient2_1234!", "El Amrani","Nadia",   Role.PATIENT, "PAT002", null);
    }

    private UserAccount createIfNotExists(String email, String password,
                                          String nom, String prenom,
                                          Role role, String cin,
                                          Long medecinAssigneId) {
        if (userRepo.existsByEmail(email)) {
            return userRepo.findByEmail(email).orElse(null);
        }

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
                .medecinAssigneId(medecinAssigneId)
                .build();

        UserAccount saved = userRepo.save(user);
        // Ne pas logger le mot de passe en clair
        log.info("[INIT] Compte {} créé : {} (id={})", role, email, saved.getId());
        return saved;
    }
}
