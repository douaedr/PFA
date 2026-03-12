package com.hospital.patient.service;

import com.hospital.patient.dto.EnvoyerMessageRequest;
import com.hospital.patient.dto.MessagePatientDTO;
import com.hospital.patient.entity.DossierMedical;
import com.hospital.patient.entity.MessagePatient;
import com.hospital.patient.entity.Patient;
import com.hospital.patient.enums.ExpediteurMessage;
import com.hospital.patient.exception.PatientNotFoundException;
import com.hospital.patient.repository.MessagePatientRepository;
import com.hospital.patient.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessagePatientRepository messageRepository;
    private final PatientRepository patientRepository;

    @Transactional(readOnly = true)
    public List<MessagePatientDTO> getMessages(Long patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new PatientNotFoundException("Patient non trouvé"));

        if (patient.getDossierMedical() == null) return List.of();

        return messageRepository
                .findByDossierMedicalIdOrderByDateEnvoiAsc(patient.getDossierMedical().getId())
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public MessagePatientDTO envoyerMessage(Long patientId, EnvoyerMessageRequest req) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new PatientNotFoundException("Patient non trouvé"));

        DossierMedical dossier = patient.getDossierMedical();
        if (dossier == null) throw new PatientNotFoundException("Dossier médical non trouvé");

        MessagePatient message = MessagePatient.builder()
                .dossierMedical(dossier)
                .contenu(req.getContenu())
                .expediteur(ExpediteurMessage.PATIENT)
                .medecinId(req.getMedecinId())
                .medecinNom(req.getMedecinNom())
                .lu(false)
                .build();

        return toDTO(messageRepository.save(message));
    }

    @Transactional
    public void marquerLu(Long patientId, Long messageId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new PatientNotFoundException("Patient non trouvé"));

        MessagePatient message = messageRepository.findById(messageId)
                .orElseThrow(() -> new PatientNotFoundException("Message non trouvé"));

        if (patient.getDossierMedical() != null &&
            message.getDossierMedical().getId().equals(patient.getDossierMedical().getId())) {
            message.setLu(true);
            messageRepository.save(message);
        }
    }

    public long countUnreadFromMedecin(Long patientId) {
        Patient patient = patientRepository.findById(patientId).orElse(null);
        if (patient == null || patient.getDossierMedical() == null) return 0;
        return messageRepository.countByDossierMedicalIdAndLuFalseAndExpediteur(
                patient.getDossierMedical().getId(), ExpediteurMessage.MEDECIN);
    }

    private MessagePatientDTO toDTO(MessagePatient m) {
        return MessagePatientDTO.builder()
                .id(m.getId())
                .contenu(m.getContenu())
                .expediteur(m.getExpediteur().name())
                .lu(m.getLu())
                .medecinId(m.getMedecinId())
                .medecinNom(m.getMedecinNom())
                .dateEnvoi(m.getDateEnvoi())
                .build();
    }
}
