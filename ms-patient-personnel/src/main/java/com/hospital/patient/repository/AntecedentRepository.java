package com.hospital.patient.repository;

import com.hospital.patient.entity.Antecedent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AntecedentRepository extends JpaRepository<Antecedent, Long> {
}
