package com.hospital.patient.config;

import com.hospital.patient.entity.Medecin;
import com.hospital.patient.repository.MedecinRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Crée les données de référence au démarrage si la base est vide.
 * Médecin de test : id=1, Dr. Jean Dupont
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final MedecinRepository medecinRepository;

    @Override
    public void run(ApplicationArguments args) {
        if (medecinRepository.count() == 0) {
            Medecin medecin = Medecin.builder()
                    .id(1L)
                    .nom("Dupont")
                    .prenom("Jean")
                    .matricule("MED001")
                    .build();
            medecinRepository.save(medecin);
            log.info("[INIT] Médecin de référence créé : Dr. Jean Dupont (id=1)");
        }
    }
}
