package com.ecommerce.payment.service;

import com.ecommerce.payment.dto.PaymentRequest;
import com.ecommerce.payment.dto.PaymentResponse;
import com.ecommerce.payment.model.PaymentTransaction;
import com.ecommerce.payment.repository.PaymentRepository;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;

    public PaymentService(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    @Transactional
    @RateLimiter(name = "paymentApi", fallbackMethod = "rateLimitFallback")
    public PaymentResponse processPayment(PaymentRequest request) {
        System.out.println(">>> [SPRING @RateLimiter & @Transactional] Processing payment for Order ID: " + request.getOrderId());

        if (request.isSimulateFailure()) {
            System.err.println(">>> [SIMULATED PAYMENT FAILURE] Payment processing failed as requested for Order ID: " + request.getOrderId());
            PaymentTransaction failedTx = new PaymentTransaction(null, "TX-FAIL-" + UUID.randomUUID().toString().substring(0, 8), request.getOrderId(), request.getAmount(), "FAILED", request.getPaymentMethod(), LocalDateTime.now());
            paymentRepository.save(failedTx);
            return new PaymentResponse(false, failedTx.getTransactionId(), request.getOrderId(), request.getAmount(), "Payment declined by issuing bank (Simulated)", "FAILED");
        }

        String txId = "TX-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        PaymentTransaction transaction = new PaymentTransaction(null, txId, request.getOrderId(), request.getAmount(), "SUCCESS", request.getPaymentMethod() != null ? request.getPaymentMethod() : "CREDIT_CARD", LocalDateTime.now());
        paymentRepository.save(transaction);

        return new PaymentResponse(true, txId, request.getOrderId(), request.getAmount(), "Payment successfully charged", "SUCCESS");
    }

    public PaymentResponse rateLimitFallback(PaymentRequest request, Throwable t) {
        System.err.println(">>> [RESILIENCE4J @RateLimiter FALLBACK] Payment API rate limit exceeded for Order ID: " + request.getOrderId());
        return new PaymentResponse(false, null, request.getOrderId(), request.getAmount(), "HTTP 429: Payment API Rate Limit Exceeded. Please slow down your requests.", "RATE_LIMITED");
    }
}
