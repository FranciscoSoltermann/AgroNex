package org.agronex.backend.listener;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.agronex.backend.dto.MercadoPagoWebhookMessage;
import org.agronex.backend.infrastructure.config.RabbitMQConfig;
import org.agronex.backend.service.MercadoPagoWebhookService;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class MercadoPagoWebhookListener {

    private final MercadoPagoWebhookService mercadoPagoWebhookService;

    @RabbitListener(queues = RabbitMQConfig.QUEUE_WEBHOOKS)
    public void processWebhook(MercadoPagoWebhookMessage message) {
        log.info("Procesando webhook asíncrono desde RabbitMQ. type={}, action={}", message.getType(), message.getAction());
        try {
            mercadoPagoWebhookService.procesarEvento(
                    message.getRawBody(),
                    message.getXSignature(),
                    message.getXRequestId(),
                    message.getTopic(),
                    message.getType(),
                    message.getAction(),
                    message.getDataId(),
                    message.getId()
            );
            log.info("Webhook procesado exitosamente.");
        } catch (Exception e) {
            log.error("Error procesando webhook desde RabbitMQ: {}", e.getMessage(), e);
            throw e; // Lanza la excepción para que RabbitMQ la mueva al DLQ tras reintentos
        }
    }
}
