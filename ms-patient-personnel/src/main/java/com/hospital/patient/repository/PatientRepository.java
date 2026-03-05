package com.hospital.patient.repository;

import com.hospital.patient.entity.Patient;
import com.hospital.patient.enums.GroupeSanguin;
import com.hospital.patient.enums.Sexe;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {

    Optional<Patient> findByCin(String cin);

    Boolean existsByCin(String cin);

    List<Patient> findByVilleIgnoreCase(String ville);

    List<Patient> findByGroupeSanguin(GroupeSanguin groupeSanguin);

    List<Patient> findBySexe(Sexe sexe);

    @Query("SELECT p FROM Patient p WHERE " +
           "LOWER(p.nom) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.prenom) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "p.cin LIKE CONCAT('%', :search, '%')")
    Page<Patient> search(@Param("search") String search, Pageable pageable);

    @Query("SELECT COUNT(p) FROM Patient p WHERE p.createdAt >= :date")
    Long countPatientsCreatedAfter(@Param("date") LocalDateTime date);
}
