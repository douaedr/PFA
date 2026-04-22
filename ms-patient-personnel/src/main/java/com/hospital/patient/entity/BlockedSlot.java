package com.hospital.patient.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

/**
 * A blocked time slot for a doctor, managed by their assigned secretary.
 * Prevents appointment booking during the specified period.
 */
@Entity
@Table(name = "blocked_slots", indexes = {
    @Index(name = "idx_blocked_doctor", columnList = "doctorId"),
    @Index(name = "idx_blocked_date",   columnList = "slotDate")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlockedSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long doctorId;

    private String doctorName;

    @Column(nullable = false)
    private LocalDate slotDate;

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    @Column(length = 200)
    private String raison;

    // ID of the secretary who created this block
    @Column(nullable = false)
    private Long secretaireId;

    private String secretaireNom;

    @Builder.Default
    private boolean actif = true;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
