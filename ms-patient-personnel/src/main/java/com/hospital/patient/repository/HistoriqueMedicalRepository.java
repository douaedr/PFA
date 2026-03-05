package com.hospital.patient.repository;

import com.hospital.patient.entity.HistoriqueMedical;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HistoriqueMedicalRepository extends JpaRepository<HistoriqueMedical, Long> {
}
