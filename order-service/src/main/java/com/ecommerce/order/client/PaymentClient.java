package com.ecommerce.order.client;

import com.ecommerce.order.dto.ClientDTOs.PaymentRequest;
import com.ecommerce.order.dto.ClientDTOs.PaymentResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "payment-service")
public interface PaymentClient {

    @PostMapping("/api/payments/process")
    PaymentResponse processPayment(@RequestBody PaymentRequest request);
}
