package org.agronex.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class CampaniaResponse {
    private UUID idCampania;   // 🔹 UUID
    private String cultivo;
    private OffsetDateTime fechaInicio;
    private OffsetDateTime fechaFin;
    private UUID idLote;       // 🔹 UUID
}