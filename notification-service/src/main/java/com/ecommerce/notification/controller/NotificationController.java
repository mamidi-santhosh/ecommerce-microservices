package com.ecommerce.notification.controller;

import com.ecommerce.notification.dto.NotificationRequest;
import com.ecommerce.notification.model.NotificationLog;
import com.ecommerce.notification.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PostMapping("/send")
    public ResponseEntity<String> sendNotification(@RequestBody NotificationRequest request) {
        notificationService.sendNotificationAsync(request);
        return ResponseEntity.accepted().body("Async notification queued successfully for Order ID: " + request.getOrderId());
    }

    @GetMapping
    public ResponseEntity<List<NotificationLog>> getAllNotifications() {
        return ResponseEntity.ok(notificationService.getAllNotifications());
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<NotificationLog>> getNotificationsForOrder(@PathVariable String orderId) {
        return ResponseEntity.ok(notificationService.getNotificationsForOrder(orderId));
    }
}
