package org.agronex.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "mercadopago_webhook_event")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MercadoPagoWebhookEvent {

    @Id
    @Column(name = "id_evento")
    private UUID idEvento;

    @Column(name = "event_key", nullable = false, unique = true, length = 512)
    private String eventKey;

    @Column(name = "event_id", nullable = false, length = 80)
    private String eventId;

    @Column(name = "request_id", length = 120)
    private String requestId;

    @Column(name = "signature_header", columnDefinition = "TEXT")
    private String signatureHeader;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false, updatable = false)
    private OffsetDateTime creadoEn;
}

