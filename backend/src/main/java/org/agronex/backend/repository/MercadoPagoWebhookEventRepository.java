package org.agronex.backend.repository;

import org.agronex.backend.entity.MercadoPagoWebhookEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface MercadoPagoWebhookEventRepository extends JpaRepository<MercadoPagoWebhookEvent, UUID> {
    boolean existsByEventKey(String eventKey);
}

