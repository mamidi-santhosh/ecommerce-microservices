# 📘 LESSON 7: APACHE KAFKA EVENT-DRIVEN MESSAGING ARCHITECTURE

> **Goal**: Master asynchronous event-driven architecture, Kafka Producer (`KafkaTemplate`), Kafka Consumer (`@KafkaListener`), topic partitions, and consumer groups.

---

## 🏬 ELI10 ANALOGY: THE MALL LOUDSPEAKER
When a cashier completes a sale, they don't walk across the mall to inform marketing. Instead, they make an announcement over the **Loudspeaker**: *"Order ORD-123 is confirmed!"*
The marketing department (Notification Service) listens to the speaker and prints the receipt automatically!

---

## ⚙️ KAFKA PRODUCER & CONSUMER IMPLEMENTATION

### 1. `KafkaProducerConfig.java` (Order Service Producer)
```java
package com.ecommerce.order.config;

import com.ecommerce.order.event.OrderEvent;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.kafka.support.serializer.JsonSerializer;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class KafkaProducerConfig {

    @Bean
    public NewTopic orderEventsTopic() {
        return TopicBuilder.name("order-events-topic")
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public ProducerFactory<String, OrderEvent> producerFactory() {
        Map<String, Object> configProps = new HashMap<>();
        configProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        configProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        configProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        return new DefaultKafkaProducerFactory<>(configProps);
    }

    @Bean
    public KafkaTemplate<String, OrderEvent> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }
}
```

---

### 2. `OrderEventConsumer.java` (Notification Service Consumer)
```java
package com.ecommerce.notification.event;

import com.ecommerce.notification.dto.NotificationRequest;
import com.ecommerce.notification.service.NotificationService;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class OrderEventConsumer {

    private final NotificationService notificationService;

    public OrderEventConsumer(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @KafkaListener(topics = "order-events-topic", groupId = "notification-group")
    public void consumeOrderEvent(OrderEvent event) {
        System.out.println(">>> [KAFKA CONSUMER] Received OrderEvent for Order ID: " + event.getOrderId());

        NotificationRequest request = new NotificationRequest(
                event.getOrderId(),
                event.getCustomerEmail(),
                "Event-Driven Kafka Notification: Your order " + event.getOrderId() + " is " + event.getStatus(),
                "EMAIL"
        );

        notificationService.sendNotificationAsync(request);
    }
}
```

---

## 🎯 INTERVIEW QUESTIONS & ANSWERS

### Q1: What is the main advantage of Kafka Event-Driven Messaging over OpenFeign REST API calls?
> **Answer**: Decoupling, performance, and fault tolerance. OpenFeign is synchronous—if `notification-service` is slow or down, the order checkout thread blocks. Kafka is asynchronous—`order-service` publishes an event to Kafka topic in milliseconds and returns immediately. If `notification-service` goes offline, Kafka stores messages on disk in topic partitions until `notification-service` recovers, preventing data loss.

---
*End of Lesson 7: Apache Kafka Event-Driven Messaging Architecture*
