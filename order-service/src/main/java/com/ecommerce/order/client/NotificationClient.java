package com.ecommerce.order.client;

import com.ecommerce.order.dto.ClientDTOs.NotificationRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "notification-service")
public interface NotificationClient {

    @PostMapping("/api/notifications/send")
    String sendNotification(@RequestBody NotificationRequest request);
}
