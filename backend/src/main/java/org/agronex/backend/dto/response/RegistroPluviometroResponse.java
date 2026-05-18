package org.agronex.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class RegistroPluviometroResponse {
    private UUID id;
    private UUID loteId;
    private LocalDate fecha;
    private BigDecimal mmCaidos;
    private String notas;
}
