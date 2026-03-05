package com.hospital.patient.repository;

import com.hospital.patient.entity.EtatActuel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EtatActuelRepository extends JpaRepository<EtatActuel, Long> {
}
