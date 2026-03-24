package org.agronex.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SuscripcionMercadoPagoRequest {

    @NotBlank(message = "El plan es obligatorio")
    private String plan;

    @NotBlank(message = "El ciclo de facturación es obligatorio")
    private String billingCycle;

    private String email;
}
