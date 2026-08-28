# 📘 LESSON 4: SAGA ORCHESTRATION & OPENFEIGN CLIENTS

> **Goal**: Deeply understand the Orchestration Saga pattern in `order-service`, local database transactions, OpenFeign HTTP inter-service calls, compensating transactions, and audit logging.

---

## 🏬 ELI10 ANALOGY: THE SHOPPING TOUR MANAGER
Buying a item requires 3 separate shops: (1) Reserve Stock ➔ (2) Pay Money ➔ (3) Mail Receipt.
What happens if the Payment Shop declines your credit card after the Inventory Shop already took the item off the shelf?
You can't do a normal single-database rollback! So the **Tour Manager** (`SagaOrchestrator`) steps in: *"Payment failed! Inventory Shop, please execute compensating action: put the item back on the shelf!"*

---

## ⚙️ SAGA ORCHESTRATOR CODE IMPLEMENTATION

### `SagaOrchestrator.java` (Line-by-Line Core Engine)
```java
package com.ecommerce.order.saga;

import com.ecommerce.order.client.InventoryClient;
import com.ecommerce.order.client.PaymentClient;
import com.ecommerce.order.event.OrderEvent;
import com.ecommerce.order.event.OrderEventProducer;
import com.ecommerce.order.model.Order;
import com.ecommerce.order.model.OrderStatus;
import com.ecommerce.order.model.SagaLog;
import com.ecommerce.order.repository.OrderRepository;
import com.ecommerce.order.repository.SagaLogRepository;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class SagaOrchestrator {

    private final OrderRepository orderRepository;
    private final SagaLogRepository sagaLogRepository;
    private final InventoryClient inventoryClient;
    private final PaymentClient paymentClient;
    private final OrderEventProducer orderEventProducer;

    public SagaOrchestrator(OrderRepository orderRepository,
                            SagaLogRepository sagaLogRepository,
                            InventoryClient inventoryClient,
                            PaymentClient paymentClient,
                            OrderEventProducer orderEventProducer) {
        this.orderRepository = orderRepository;
        this.sagaLogRepository = sagaLogRepository;
        this.inventoryClient = inventoryClient;
        this.paymentClient = paymentClient;
        this.orderEventProducer = orderEventProducer;
    }

    @Transactional
    public OrderResponse executeOrderSaga(OrderRequest request) {
        String orderId = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // STEP 1: Local Transaction - Save Order (PENDING)
        Order order = new Order(
                null, orderId, request.getCustomerEmail(), request.getSku(),
                request.getQuantity(), request.getAmount(), OrderStatus.PENDING, null, LocalDateTime.now()
        );
        orderRepository.save(order);
        logSagaStep(orderId, "CREATE_ORDER", "COMPLETED", "Saved local order with status PENDING");

        // STEP 2: OpenFeign Call - Reserve Stock in Inventory Service
        logSagaStep(orderId, "RESERVE_INVENTORY", "STARTED", "Reserving stock for SKU: " + request.getSku());
        InventoryResponse inventoryResponse;
        try {
            inventoryResponse = inventoryClient.reserveStock(new ReservationRequest(orderId, request.getSku(), request.getQuantity()));
        } catch (Exception e) {
            order.setStatus(OrderStatus.CANCELLED_OUT_OF_STOCK);
            orderRepository.save(order);
            return buildOrderResponse(order, orderId);
        }

        if (!inventoryResponse.isSuccess()) {
            order.setStatus(OrderStatus.CANCELLED_OUT_OF_STOCK);
            orderRepository.save(order);
            return buildOrderResponse(order, orderId);
        }

        order.setStatus(OrderStatus.INVENTORY_RESERVED);
        orderRepository.save(order);

        // STEP 3: Resilience4j @CircuitBreaker Call - Process Payment
        logSagaStep(orderId, "PROCESS_PAYMENT", "STARTED", "Charging credit card via Payment Service");
        PaymentResponse paymentResponse = executePaymentWithCircuitBreaker(orderId, request);

        if (!paymentResponse.isSuccess()) {
            logSagaStep(orderId, "PROCESS_PAYMENT", "FAILED", "Payment failed: " + paymentResponse.getMessage());

            // SAGA COMPENSATING TRANSACTION: Rollback Inventory Reservation!
            logSagaStep(orderId, "COMPENSATE_INVENTORY", "STARTED", "Triggering Saga Compensation: Releasing stock");
            try {
                inventoryClient.releaseStock(new ReservationRequest(orderId, request.getSku(), request.getQuantity()));
                logSagaStep(orderId, "COMPENSATE_INVENTORY", "COMPENSATED", "Stock compensation completed successfully.");
            } catch (Exception e) {
                logSagaStep(orderId, "COMPENSATE_INVENTORY", "FAILED", "Critical compensation error: " + e.getMessage());
            }

            order.setStatus("CIRCUIT_OPEN".equals(paymentResponse.getStatus()) ? OrderStatus.CANCELLED_CIRCUIT_OPEN : OrderStatus.CANCELLED_PAYMENT_FAILED);
            orderRepository.save(order);
            return buildOrderResponse(order, orderId);
        }

        // STEP 4: Confirm Order & Publish Kafka Event
        order.setStatus(OrderStatus.CONFIRMED);
        orderRepository.save(order);
        logSagaStep(orderId, "CONFIRM_ORDER", "COMPLETED", "Order CONFIRMED!");

        OrderEvent event = new OrderEvent(orderId, order.getCustomerEmail(), order.getSku(), order.getQuantity(), order.getTotalAmount(), order.getStatus().name(), "Order confirmed", LocalDateTime.now());
        orderEventProducer.sendOrderEvent(event);
        logSagaStep(orderId, "KAFKA_EVENT_PUBLISHED", "DISPATCHED", "Published event to Kafka topic [order-events-topic]");

        return buildOrderResponse(order, orderId);
    }
}
```

---

## 🎯 INTERVIEW QUESTIONS & ANSWERS

### Q1: What is the difference between Saga Choreography and Saga Orchestration?
> **Answer**: In **Choreography**, services listen to domain events and decide autonomously what action to take next without a central controller. In **Orchestration**, a single central coordinator (`SagaOrchestrator`) explicitly directs workflow execution by invoking participant REST/Feign APIs and evaluating responses to execute compensating transactions on failure. Orchestration provides better visibility, centralized audit logging, and simpler debugging for complex workflows.

---
*End of Lesson 4: Saga Orchestration & OpenFeign Clients*
