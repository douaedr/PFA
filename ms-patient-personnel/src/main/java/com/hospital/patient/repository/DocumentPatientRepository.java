package com.hospital.patient.repository;

import com.hospital.patient.entity.DocumentPatient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentPatientRepository extends JpaRepository<DocumentPatient, Long> {

    List<DocumentPatient> findByDossierMedicalIdOrderByDateUploadDesc(Long dossierId);

    Optional<DocumentPatient> findByIdAndDossierMedicalPatientId(Long id, Long patientId);
}
