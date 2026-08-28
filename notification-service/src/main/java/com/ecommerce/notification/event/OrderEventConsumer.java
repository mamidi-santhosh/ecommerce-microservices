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
        System.out.println(String.format(">>> [KAFKA CONSUMER] Received OrderEvent for Order ID: %s, Status: %s", event.getOrderId(), event.getStatus()));

        NotificationRequest request = new NotificationRequest(
                event.getOrderId(),
                event.getCustomerEmail(),
                "Event-Driven Kafka Notification: Your order " + event.getOrderId() + " is " + event.getStatus(),
                "EMAIL"
        );

        notificationService.sendNotificationAsync(request);
        System.out.println(">>> [KAFKA CONSUMER] Processed event and logged notification to database successfully.");
    }
}
