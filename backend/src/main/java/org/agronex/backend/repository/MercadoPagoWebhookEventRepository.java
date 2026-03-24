package org.agronex.backend.repository;

import org.agronex.backend.entity.MercadoPagoWebhookEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface MercadoPagoWebhookEventRepository extends JpaRepository<MercadoPagoWebhookEvent, UUID> {
    boolean existsByEventKey(String eventKey);
}
