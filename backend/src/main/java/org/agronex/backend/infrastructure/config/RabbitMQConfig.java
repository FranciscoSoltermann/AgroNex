package org.agronex.backend.infrastructure.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE_WEBHOOKS = "ex.mercadopago";
    public static final String QUEUE_WEBHOOKS = "q.mercadopago.webhooks";
    public static final String QUEUE_WEBHOOKS_DLQ = "q.mercadopago.webhooks.dlq";
    public static final String ROUTING_KEY_WEBHOOKS = "mercadopago.webhook.#";

    @Bean
    public DirectExchange webhooksExchange() {
        return new DirectExchange(EXCHANGE_WEBHOOKS);
    }

    @Bean
    public Queue webhooksQueue() {
        return QueueBuilder.durable(QUEUE_WEBHOOKS)
                .withArgument("x-dead-letter-exchange", "")
                .withArgument("x-dead-letter-routing-key", QUEUE_WEBHOOKS_DLQ)
                .build();
    }

    @Bean
    public Queue webhooksDlq() {
        return QueueBuilder.durable(QUEUE_WEBHOOKS_DLQ).build();
    }

    @Bean
    public Binding bindingWebhooksQueue(Queue webhooksQueue, DirectExchange webhooksExchange) {
        return BindingBuilder.bind(webhooksQueue).to(webhooksExchange).with(ROUTING_KEY_WEBHOOKS);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(jsonMessageConverter());
        return rabbitTemplate;
    }
}
