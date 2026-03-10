package org.agronex.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampaniaResponse {
    private Long idCampania;
    private String cultivo;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private Long idLote;
}