package com.ecommerce.order.event;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class OrderEventProducer {

    private static final String TOPIC = "order-events-topic";
    private final KafkaTemplate<String, OrderEvent> kafkaTemplate;

    public OrderEventProducer(KafkaTemplate<String, OrderEvent> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void sendOrderEvent(OrderEvent event) {
        try {
            kafkaTemplate.send(TOPIC, event.getOrderId(), event);
            System.out.println(String.format(">>> [KAFKA PRODUCER] Published OrderEvent to topic [%s] for Order ID: %s", TOPIC, event.getOrderId()));
        } catch (Exception e) {
            System.err.println(">>> [KAFKA PRODUCER ERROR] Failed to publish OrderEvent: " + e.getMessage());
        }
    }
}
