package com.hospital.patient.repository;

import com.hospital.patient.entity.MessagePatient;
import com.hospital.patient.enums.ExpediteurMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessagePatientRepository extends JpaRepository<MessagePatient, Long> {

    List<MessagePatient> findByDossierMedicalIdOrderByDateEnvoiAsc(Long dossierId);

    long countByDossierMedicalIdAndLuFalseAndExpediteur(Long dossierId, ExpediteurMessage expediteur);
}
