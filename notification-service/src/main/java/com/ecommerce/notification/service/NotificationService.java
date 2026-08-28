package com.ecommerce.notification.service;

import com.ecommerce.notification.dto.NotificationRequest;
import com.ecommerce.notification.model.NotificationLog;
import com.ecommerce.notification.repository.NotificationRepository;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Async
    @Transactional
    public CompletableFuture<Void> sendNotificationAsync(NotificationRequest request) {
        System.out.println(">>> [SPRING @Async Processing] Asynchronously dispatching notification to thread pool for Order ID: " + request.getOrderId());
        try {
            // Simulate slight async background dispatch delay (e.g. SMTP/SMS gateway)
            Thread.sleep(500);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        NotificationLog log = new NotificationLog(
                null,
                request.getOrderId(),
                request.getRecipientEmail() != null ? request.getRecipientEmail() : "customer@example.com",
                request.getMessage(),
                request.getChannel() != null ? request.getChannel() : "EMAIL",
                LocalDateTime.now()
        );
        notificationRepository.save(log);
        System.out.println(">>> [SPRING @Async & @Transactional] Notification logged to database asynchronously for Order ID: " + request.getOrderId());

        return CompletableFuture.completedFuture(null);
    }

    public List<NotificationLog> getNotificationsForOrder(String orderId) {
        return notificationRepository.findByOrderId(orderId);
    }

    public List<NotificationLog> getAllNotifications() {
        return notificationRepository.findAll();
    }
}
