package com.ecommerce.order.saga;

import com.ecommerce.order.client.InventoryClient;
import com.ecommerce.order.client.NotificationClient;
import com.ecommerce.order.client.PaymentClient;
import com.ecommerce.order.dto.ClientDTOs.InventoryResponse;
import com.ecommerce.order.dto.ClientDTOs.NotificationRequest;
import com.ecommerce.order.dto.ClientDTOs.PaymentRequest;
import com.ecommerce.order.dto.ClientDTOs.PaymentResponse;
import com.ecommerce.order.dto.ClientDTOs.ReservationRequest;
import com.ecommerce.order.dto.OrderRequest;
import com.ecommerce.order.dto.OrderResponse;
import com.ecommerce.order.model.Order;
import com.ecommerce.order.model.OrderStatus;
import com.ecommerce.order.model.SagaLog;
import com.ecommerce.order.repository.OrderRepository;
import com.ecommerce.order.repository.SagaLogRepository;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.ecommerce.order.event.OrderEvent;
import com.ecommerce.order.event.OrderEventProducer;

@Service
public class SagaOrchestrator {

    private final OrderRepository orderRepository;
    private final SagaLogRepository sagaLogRepository;
    private final InventoryClient inventoryClient;
    private final PaymentClient paymentClient;
    private final NotificationClient notificationClient;
    private final OrderEventProducer orderEventProducer;

    public SagaOrchestrator(OrderRepository orderRepository,
                            SagaLogRepository sagaLogRepository,
                            InventoryClient inventoryClient,
                            PaymentClient paymentClient,
                            NotificationClient notificationClient,
                            OrderEventProducer orderEventProducer) {
        this.orderRepository = orderRepository;
        this.sagaLogRepository = sagaLogRepository;
        this.inventoryClient = inventoryClient;
        this.paymentClient = paymentClient;
        this.notificationClient = notificationClient;
        this.orderEventProducer = orderEventProducer;
    }

    @Transactional
    public OrderResponse executeOrderSaga(OrderRequest request) {
        String orderId = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        System.out.println("===============================================================================");
        System.out.println(">>> [SAGA ORCHESTRATOR] Initializing Checkout Saga for Order ID: " + orderId);
        System.out.println("===============================================================================");

        // STEP 1: Local Transaction - Save Order (PENDING)
        Order order = new Order(
                null,
                orderId,
                request.getCustomerEmail() != null ? request.getCustomerEmail() : "user@example.com",
                request.getSku(),
                request.getQuantity(),
                request.getAmount(),
                OrderStatus.PENDING,
                null,
                LocalDateTime.now()
        );
        orderRepository.save(order);
        logSagaStep(orderId, "CREATE_ORDER", "COMPLETED", "Saved order to local MySQL database with status PENDING");

        // STEP 2: Inter-Service Feign Call - Reserve Stock in Inventory Service
        logSagaStep(orderId, "RESERVE_INVENTORY", "STARTED", "Dispatching Feign request to Inventory Service for SKU: " + request.getSku());
        InventoryResponse inventoryResponse;
        try {
            inventoryResponse = inventoryClient.reserveStock(new ReservationRequest(orderId, request.getSku(), request.getQuantity()));
        } catch (Exception e) {
            logSagaStep(orderId, "RESERVE_INVENTORY", "FAILED", "Inventory service Feign call failed: " + e.getMessage());
            order.setStatus(OrderStatus.CANCELLED_OUT_OF_STOCK);
            order.setFailureReason("Inventory service unavailable or stock check error");
            orderRepository.save(order);
            return buildOrderResponse(order, orderId);
        }

        if (!inventoryResponse.isSuccess()) {
            logSagaStep(orderId, "RESERVE_INVENTORY", "FAILED", "Stock reservation rejected: " + inventoryResponse.getMessage());
            order.setStatus(OrderStatus.CANCELLED_OUT_OF_STOCK);
            order.setFailureReason(inventoryResponse.getMessage());
            orderRepository.save(order);
            return buildOrderResponse(order, orderId);
        }

        logSagaStep(orderId, "RESERVE_INVENTORY", "COMPLETED", "Stock successfully reserved! Remaining stock: " + inventoryResponse.getRemainingStock());
        order.setStatus(OrderStatus.INVENTORY_RESERVED);
        orderRepository.save(order);

        // STEP 3: Inter-Service Feign Call + Resilience4j @CircuitBreaker - Process Payment
        logSagaStep(orderId, "PROCESS_PAYMENT", "STARTED", "Dispatching Feign request with @CircuitBreaker to Payment Service");
        PaymentResponse paymentResponse = executePaymentWithCircuitBreaker(orderId, request);

        if (!paymentResponse.isSuccess()) {
            logSagaStep(orderId, "PROCESS_PAYMENT", "FAILED", "Payment failed: " + paymentResponse.getMessage());
            
            // SAGA COMPENSATION STEP: Rollback Inventory Reservation!
            logSagaStep(orderId, "COMPENSATE_INVENTORY", "STARTED", "Triggering Saga Compensation: Releasing reserved stock for SKU: " + request.getSku());
            try {
                inventoryClient.releaseStock(new ReservationRequest(orderId, request.getSku(), request.getQuantity()));
                logSagaStep(orderId, "COMPENSATE_INVENTORY", "COMPENSATED", "Stock compensation complete: Inventory restocked successfully.");
            } catch (Exception e) {
                logSagaStep(orderId, "COMPENSATE_INVENTORY", "FAILED", "Critical Saga Error: Stock release compensation failed: " + e.getMessage());
            }

            if ("CIRCUIT_OPEN".equals(paymentResponse.getStatus())) {
                order.setStatus(OrderStatus.CANCELLED_CIRCUIT_OPEN);
            } else {
                order.setStatus(OrderStatus.CANCELLED_PAYMENT_FAILED);
            }
            order.setFailureReason(paymentResponse.getMessage());
            orderRepository.save(order);
            return buildOrderResponse(order, orderId);
        }

        // STEP 4: Confirm Order & Complete Saga
        logSagaStep(orderId, "PROCESS_PAYMENT", "COMPLETED", "Payment charged successfully! Tx ID: " + paymentResponse.getTransactionId());
        order.setStatus(OrderStatus.CONFIRMED);
        orderRepository.save(order);
        logSagaStep(orderId, "CONFIRM_ORDER", "COMPLETED", "Saga Orchestration Complete! Order CONFIRMED.");

        // STEP 5: Kafka Event-Driven Message & Notification Dispatch
        try {
            OrderEvent event = new OrderEvent(
                    orderId,
                    order.getCustomerEmail(),
                    order.getSku(),
                    order.getQuantity(),
                    order.getTotalAmount(),
                    order.getStatus().name(),
                    "Order " + orderId + " confirmed successfully!",
                    LocalDateTime.now()
            );
            orderEventProducer.sendOrderEvent(event);
            logSagaStep(orderId, "KAFKA_EVENT_PUBLISHED", "DISPATCHED", "Published OrderEvent to Kafka topic [order-events-topic]");

            notificationClient.sendNotification(new NotificationRequest(orderId, order.getCustomerEmail(), "Your order " + orderId + " has been confirmed!", "EMAIL"));
            logSagaStep(orderId, "ASYNC_NOTIFICATION", "DISPATCHED", "Triggered @Async notification request to Notification Service");
        } catch (Exception e) {
            System.err.println("Async notification / Kafka event trigger warning: " + e.getMessage());
        }

        return buildOrderResponse(order, orderId);
    }

    @CircuitBreaker(name = "paymentServiceCircuitBreaker", fallbackMethod = "paymentCircuitBreakerFallback")
    public PaymentResponse executePaymentWithCircuitBreaker(String orderId, OrderRequest request) {
        return paymentClient.processPayment(new PaymentRequest(
                orderId,
                request.getAmount(),
                request.getPaymentMethod(),
                request.isSimulatePaymentFailure()
        ));
    }

    public PaymentResponse paymentCircuitBreakerFallback(String orderId, OrderRequest request, Throwable throwable) {
        System.err.println(">>> [RESILIENCE4J @CircuitBreaker FALLBACK] Payment Service Call Intercepted! Reason: " + throwable.getMessage());
        return new PaymentResponse(
                false,
                null,
                orderId,
                request.getAmount(),
                "Payment Service Circuit Breaker OPEN! Inter-service call tripped: " + throwable.getMessage(),
                "CIRCUIT_OPEN"
        );
    }

    private void logSagaStep(String orderId, String stepName, String status, String details) {
        SagaLog log = new SagaLog(null, orderId, stepName, status, details, LocalDateTime.now());
        sagaLogRepository.save(log);
        System.out.println(String.format(">>> [SAGA LOG] [%s] %s -> %s: %s", orderId, stepName, status, details));
    }

    private OrderResponse buildOrderResponse(Order order, String orderId) {
        List<SagaLog> logs = sagaLogRepository.findByOrderIdOrderByIdAsc(orderId);
        return new OrderResponse(
                order.getOrderId(),
                order.getCustomerEmail(),
                order.getSku(),
                order.getQuantity(),
                order.getTotalAmount(),
                order.getStatus(),
                order.getFailureReason(),
                order.getCreatedAt(),
                logs
        );
    }
}
