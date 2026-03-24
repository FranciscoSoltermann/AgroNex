package org.agronex.backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SuscripcionMercadoPagoResponse {
    private String checkoutUrl;
    private String preapprovalId;
}
