package com.hospital.patient.repository;

import com.hospital.patient.entity.DossierMedical;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DossierMedicalRepository extends JpaRepository<DossierMedical, Long> {

    Optional<DossierMedical> findByPatient_Id(Long patientId);

    Optional<DossierMedical> findByNumeroDossier(String numeroDossier);
}
