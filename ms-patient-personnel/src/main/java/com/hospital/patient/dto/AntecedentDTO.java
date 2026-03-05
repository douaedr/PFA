package com.hospital.patient.dto;

import com.hospital.patient.enums.NiveauSeverite;
import com.hospital.patient.enums.TypeAntecedent;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AntecedentDTO {

    private Long id;

    @NotNull(message = "Le type d'antécédent est obligatoire")
    private TypeAntecedent typeAntecedent;

    private String description;
    private LocalDate dateDiagnostic;
    private NiveauSeverite severite;
    private Boolean actif;
    private String source;
}
