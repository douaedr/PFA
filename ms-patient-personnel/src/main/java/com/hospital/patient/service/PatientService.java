package com.hospital.patient.service;

import com.hospital.patient.dto.*;
import com.hospital.patient.entity.*;
import com.hospital.patient.enums.*;
import com.hospital.patient.exception.PatientAlreadyExistsException;
import com.hospital.patient.exception.PatientNotFoundException;
import com.hospital.patient.mapper.PatientMapper;
import com.hospital.patient.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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

        // Création automatique du dossier médical avec les données initiales
        DossierMedical dossier = new DossierMedical();

        // Antécédents initiaux
        if (dto.getAntecedents() != null) {
            for (PatientRequestDTO.AntecedentItem item : dto.getAntecedents()) {
                try {
                    Antecedent ant = Antecedent.builder()
                            .typeAntecedent(TypeAntecedent.valueOf(item.getType()))
                            .description(item.getDescription())
                            .dateDiagnostic(item.getDateApparition())
                            .actif(item.getActif() != null ? item.getActif() : true)
                            .build();
                    dossier.getAntecedents().add(ant);
                } catch (IllegalArgumentException e) {
                    log.warn("Type d'antécédent invalide ignoré: {}", item.getType());
                }
            }
        }

        // Ordonnances initiales
        if (dto.getOrdonnances() != null) {
            for (PatientRequestDTO.OrdonnanceItem item : dto.getOrdonnances()) {
                try {
                    Ordonnance ord = Ordonnance.builder()
                            .dateOrdonnance(item.getDate())
                            .typeOrdonnance(TypeOrdonnance.valueOf(item.getType()))
                            .instructions(item.getObservations())
                            .estRenouvele(false)
                            .build();
                    if (item.getMedicaments() != null && !item.getMedicaments().isBlank()) {
                        LigneOrdonnance ligne = LigneOrdonnance.builder()
                                .medicament(item.getMedicaments())
                                .instructions(item.getObservations())
                                .build();
                        ord.getLignes().add(ligne);
                    }
                    dossier.getOrdonnances().add(ord);
                } catch (IllegalArgumentException e) {
                    log.warn("Type d'ordonnance invalide ignoré: {}", item.getType());
                }
            }
        }

        // Analyses initiales
        if (dto.getAnalyses() != null) {
            for (PatientRequestDTO.AnalyseItem item : dto.getAnalyses()) {
                try {
                    AnalyseLaboratoire analyse = AnalyseLaboratoire.builder()
                            .typeAnalyse(item.getTypeAnalyse())
                            .dateAnalyse(item.getDateAnalyse())
                            .resultats(item.getResultats())
                            .laboratoire(item.getLaboratoire())
                            .statut(item.getStatut() != null ? StatutAnalyse.valueOf(item.getStatut()) : StatutAnalyse.EN_ATTENTE)
                            .build();
                    dossier.getAnalyses().add(analyse);
                } catch (IllegalArgumentException e) {
                    log.warn("Statut d'analyse invalide ignoré: {}", item.getStatut());
                }
            }
        }

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

    // ─── Dossier Médical Complet ──────────────────────────────────────────────

    @Transactional(readOnly = true)
    public DossierMedicalDTO getDossierMedical(Long patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new PatientNotFoundException("Patient non trouvé avec l'id: " + patientId));

        DossierMedical d = patient.getDossierMedical();
        if (d == null) {
            throw new PatientNotFoundException("Aucun dossier médical pour ce patient");
        }

        return DossierMedicalDTO.builder()
                .id(d.getId())
                .numeroDossier(d.getNumeroDossier())
                .dateCreation(d.getDateCreation())
                .patient(patientMapper.toResponseDTO(patient))
                .consultations(d.getConsultations().stream().map(this::mapConsultation).collect(Collectors.toList()))
                .antecedents(d.getAntecedents().stream().map(this::mapAntecedent).collect(Collectors.toList()))
                .ordonnances(d.getOrdonnances().stream().map(this::mapOrdonnance).collect(Collectors.toList()))
                .analyses(d.getAnalyses().stream().map(this::mapAnalyse).collect(Collectors.toList()))
                .radiologies(d.getRadiologies().stream().map(this::mapRadiologie).collect(Collectors.toList()))
                .build();
    }

    // ─── Mise à jour ─────────────────────────────────────────────────────────

    public PatientResponseDTO updatePatient(Long id, PatientRequestDTO dto) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new PatientNotFoundException("Patient non trouvé avec l'id: " + id));

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

    // ─── Mappers internes ─────────────────────────────────────────────────────

    private ConsultationDTO mapConsultation(Consultation c) {
        return ConsultationDTO.builder()
                .id(c.getId())
                .dateConsultation(c.getDateConsultation())
                .motif(c.getMotif())
                .diagnostic(c.getDiagnostic())
                .observations(c.getObservations())
                .traitement(c.getTraitement())
                .poids(c.getPoids())
                .taille(c.getTaille())
                .tensionSystolique(c.getTensionSystolique())
                .tensionDiastolique(c.getTensionDiastolique())
                .temperature(c.getTemperature())
                .medecinId(c.getMedecin() != null ? c.getMedecin().getId() : null)
                .medecinNomComplet(c.getMedecin() != null ? c.getMedecin().getNomComplet() : null)
                .build();
    }

    private AntecedentDTO mapAntecedent(Antecedent a) {
        return AntecedentDTO.builder()
                .id(a.getId())
                .typeAntecedent(a.getTypeAntecedent())
                .description(a.getDescription())
                .dateDiagnostic(a.getDateDiagnostic())
                .severite(a.getSeverite())
                .actif(a.getActif())
                .source(a.getSource())
                .build();
    }

    private OrdonnanceDTO mapOrdonnance(Ordonnance o) {
        List<OrdonnanceDTO.LigneOrdonnanceDTO> lignes = o.getLignes().stream()
                .map(l -> OrdonnanceDTO.LigneOrdonnanceDTO.builder()
                        .id(l.getId())
                        .medicament(l.getMedicament())
                        .dosage(l.getDosage())
                        .posologie(l.getPosologie())
                        .dureeJours(l.getDureeJours())
                        .quantite(l.getQuantite())
                        .instructions(l.getInstructions())
                        .build())
                .collect(Collectors.toList());

        return OrdonnanceDTO.builder()
                .id(o.getId())
                .dateOrdonnance(o.getDateOrdonnance())
                .typeOrdonnance(o.getTypeOrdonnance() != null ? o.getTypeOrdonnance().name() : null)
                .instructions(o.getInstructions())
                .estRenouvele(o.getEstRenouvele())
                .dateExpiration(o.getDateExpiration())
                .medecinNomComplet(o.getMedecin() != null ? o.getMedecin().getNomComplet() : null)
                .lignes(lignes)
                .build();
    }

    private AnalyseDTO mapAnalyse(AnalyseLaboratoire a) {
        return AnalyseDTO.builder()
                .id(a.getId())
                .dateAnalyse(a.getDateAnalyse())
                .dateResultat(a.getDateResultat())
                .typeAnalyse(a.getTypeAnalyse())
                .resultats(a.getResultats())
                .valeurReference(a.getValeurReference())
                .statut(a.getStatut() != null ? a.getStatut().name() : null)
                .laboratoire(a.getLaboratoire())
                .prescripteur(a.getPrescripteur())
                .build();
    }

    private RadiologieDTO mapRadiologie(Radiologie r) {
        return RadiologieDTO.builder()
                .id(r.getId())
                .dateExamen(r.getDateExamen())
                .typeExamen(r.getTypeExamen() != null ? r.getTypeExamen().name() : null)
                .description(r.getDescription())
                .conclusion(r.getConclusion())
                .prescripteur(r.getPrescripteur())
                .radiologue(r.getRadiologue())
                .build();
    }
}
