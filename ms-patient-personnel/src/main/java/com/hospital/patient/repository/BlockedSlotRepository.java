package com.hospital.patient.repository;

import com.hospital.patient.entity.BlockedSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface BlockedSlotRepository extends JpaRepository<BlockedSlot, Long> {

    List<BlockedSlot> findByDoctorIdAndActifTrueOrderBySlotDateAscStartTimeAsc(Long doctorId);

    List<BlockedSlot> findByDoctorIdAndSlotDateAndActifTrue(Long doctorId, LocalDate date);

    List<BlockedSlot> findBySecretaireIdOrderByCreatedAtDesc(Long secretaireId);

    List<BlockedSlot> findByDoctorIdAndSlotDateBetweenAndActifTrue(
            Long doctorId, LocalDate from, LocalDate to);
}
