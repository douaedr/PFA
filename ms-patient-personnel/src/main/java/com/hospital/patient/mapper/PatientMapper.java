package com.hospital.patient.mapper;

import com.hospital.patient.dto.PatientRequestDTO;
import com.hospital.patient.dto.PatientResponseDTO;
import com.hospital.patient.entity.Patient;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.Period;

@Component
public class PatientMapper {

    public PatientResponseDTO toResponseDTO(Patient patient) {
        if (patient == null) return null;

        return PatientResponseDTO.builder()
                .id(patient.getId())
                .nom(patient.getNom())
                .prenom(patient.getPrenom())
                .cin(patient.getCin())
                .dateNaissance(patient.getDateNaissance())
                .age(calcAge(patient.getDateNaissance()))
                .sexe(patient.getSexe())
                .groupeSanguin(patient.getGroupeSanguin())
                .telephone(patient.getTelephone())
                .email(patient.getEmail())
                .adresse(patient.getAdresse())
                .ville(patient.getVille())
                .mutuelle(patient.getMutuelle())
                .numeroCNSS(patient.getNumeroCNSS())
                .numeroDossier(patient.getDossierMedical() != null
                        ? patient.getDossierMedical().getNumeroDossier()
                        : null)
                .createdAt(patient.getCreatedAt())
                .build();
    }

    public Patient toEntity(PatientRequestDTO dto) {
        if (dto == null) return null;

        return Patient.builder()
                .nom(dto.getNom())
                .prenom(dto.getPrenom())
                .cin(dto.getCin())
                .dateNaissance(dto.getDateNaissance())
                .sexe(dto.getSexe())
                .groupeSanguin(dto.getGroupeSanguin())
                .telephone(dto.getTelephone())
                .email(dto.getEmail())
                .adresse(dto.getAdresse())
                .ville(dto.getVille())
                .mutuelle(dto.getMutuelle())
                .numeroCNSS(dto.getNumeroCNSS())
                .build();
    }

    public void updateEntityFromDTO(PatientRequestDTO dto, Patient patient) {
        patient.setNom(dto.getNom());
        patient.setPrenom(dto.getPrenom());
        patient.setCin(dto.getCin());
        patient.setDateNaissance(dto.getDateNaissance());
        patient.setSexe(dto.getSexe());
        patient.setGroupeSanguin(dto.getGroupeSanguin());
        patient.setTelephone(dto.getTelephone());
        patient.setEmail(dto.getEmail());
        patient.setAdresse(dto.getAdresse());
        patient.setVille(dto.getVille());
        patient.setMutuelle(dto.getMutuelle());
        patient.setNumeroCNSS(dto.getNumeroCNSS());
    }

    private int calcAge(LocalDate dateNaissance) {
        if (dateNaissance == null) return 0;
        return Period.between(dateNaissance, LocalDate.now()).getYears();
    }
}
