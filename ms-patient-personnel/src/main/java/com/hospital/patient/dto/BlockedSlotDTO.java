package com.hospital.patient.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlockedSlotDTO {
    private Long id;
    private Long doctorId;
    private String doctorName;
    private LocalDate slotDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String raison;
    private Long secretaireId;
    private String secretaireNom;
    private boolean actif;
    private LocalDateTime createdAt;
}
