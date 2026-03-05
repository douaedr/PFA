package com.hospital.patient.service;

import com.hospital.patient.dto.PatientRequestDTO;
import com.hospital.patient.dto.PatientResponseDTO;
import com.hospital.patient.entity.DossierMedical;
import com.hospital.patient.entity.Patient;
import com.hospital.patient.enums.Sexe;
import com.hospital.patient.exception.PatientAlreadyExistsException;
import com.hospital.patient.exception.PatientNotFoundException;
import com.hospital.patient.mapper.PatientMapper;
import com.hospital.patient.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@Transactional
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository patientRepository;
    private final PatientMapper patientMapper;

    // ─── Création ────────────────────────────────────────────────────────────

    public PatientResponseDTO createPatient(PatientRequestDTO dto) {
        if (patientRepository.existsByCin(dto.getCin())) {
            throw new PatientAlreadyExistsException("Un patient avec le CIN " + dto.getCin() + " existe déjà");
        }

        Patient patient = patientMapper.toEntity(dto);

        // Création automatique du dossier médical
        DossierMedical dossier = new DossierMedical();
        patient.setDossierMedical(dossier);

        Patient saved = patientRepository.save(patient);
        return patientMapper.toResponseDTO(saved);
    }

    // ─── Lecture ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PatientResponseDTO getPatientById(Long id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new PatientNotFoundException("Patient non trouvé avec l'id: " + id));
        return patientMapper.toResponseDTO(patient);
    }

    @Transactional(readOnly = true)
    public PatientResponseDTO getPatientByCin(String cin) {
        Patient patient = patientRepository.findByCin(cin)
                .orElseThrow(() -> new PatientNotFoundException("Patient non trouvé avec le CIN: " + cin));
        return patientMapper.toResponseDTO(patient);
    }

    @Transactional(readOnly = true)
    public Page<PatientResponseDTO> getAllPatients(Pageable pageable) {
        return patientRepository.findAll(pageable).map(patientMapper::toResponseDTO);
    }

    @Transactional(readOnly = true)
    public Page<PatientResponseDTO> searchPatients(String search, Pageable pageable) {
        return patientRepository.search(search, pageable).map(patientMapper::toResponseDTO);
    }

    // ─── Mise à jour ─────────────────────────────────────────────────────────

    public PatientResponseDTO updatePatient(Long id, PatientRequestDTO dto) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new PatientNotFoundException("Patient non trouvé avec l'id: " + id));

        // Vérifier si le CIN est changé et s'il appartient à un autre patient
        if (!patient.getCin().equals(dto.getCin()) && patientRepository.existsByCin(dto.getCin())) {
            throw new PatientAlreadyExistsException("Le CIN " + dto.getCin() + " est déjà utilisé par un autre patient");
        }

        patientMapper.updateEntityFromDTO(dto, patient);
        return patientMapper.toResponseDTO(patientRepository.save(patient));
    }

    // ─── Suppression ─────────────────────────────────────────────────────────

    public void deletePatient(Long id) {
        if (!patientRepository.existsById(id)) {
            throw new PatientNotFoundException("Patient non trouvé avec l'id: " + id);
        }
        patientRepository.deleteById(id);
    }

    // ─── Statistiques ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Map<String, Long> getStatistiques() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("total", patientRepository.count());
        stats.put("nouveauxCeMois", patientRepository.countPatientsCreatedAfter(
                LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0)));
        stats.put("masculins", (long) patientRepository.findBySexe(Sexe.MASCULIN).size());
        stats.put("feminins", (long) patientRepository.findBySexe(Sexe.FEMININ).size());
        return stats;
    }
}
