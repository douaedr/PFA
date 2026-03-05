package com.hospital.patient.repository;

import com.hospital.patient.entity.CertificatMedical;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CertificatRepository extends JpaRepository<CertificatMedical, Long> {
}
