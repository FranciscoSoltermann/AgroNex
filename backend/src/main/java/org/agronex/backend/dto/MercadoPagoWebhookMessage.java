package org.agronex.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MercadoPagoWebhookMessage implements Serializable {
    private String rawBody;
    private String xSignature;
    private String xRequestId;
    private String topic;
    private String type;
    private String action;
    private String dataId;
    private String id;
}
