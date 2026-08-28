package com.ecommerce.order.controller;

import com.ecommerce.order.dto.OrderRequest;
import com.ecommerce.order.dto.OrderResponse;
import com.ecommerce.order.model.Order;
import com.ecommerce.order.model.SagaLog;
import com.ecommerce.order.repository.OrderRepository;
import com.ecommerce.order.repository.SagaLogRepository;
import com.ecommerce.order.saga.SagaOrchestrator;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final SagaOrchestrator sagaOrchestrator;
    private final OrderRepository orderRepository;
    private final SagaLogRepository sagaLogRepository;

    public OrderController(SagaOrchestrator sagaOrchestrator, OrderRepository orderRepository, SagaLogRepository sagaLogRepository) {
        this.sagaOrchestrator = sagaOrchestrator;
        this.orderRepository = orderRepository;
        this.sagaLogRepository = sagaLogRepository;
    }

    @PostMapping
    public ResponseEntity<OrderResponse> placeOrder(@RequestBody OrderRequest request) {
        OrderResponse response = sagaOrchestrator.executeOrderSaga(request);
        if (response.getStatus().name().startsWith("CANCELLED")) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(orderRepository.findAll());
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable String orderId) {
        return orderRepository.findByOrderId(orderId)
                .map(order -> {
                    List<SagaLog> logs = sagaLogRepository.findByOrderIdOrderByIdAsc(orderId);
                    return ResponseEntity.ok(new OrderResponse(
                            order.getOrderId(),
                            order.getCustomerEmail(),
                            order.getSku(),
                            order.getQuantity(),
                            order.getTotalAmount(),
                            order.getStatus(),
                            order.getFailureReason(),
                            order.getCreatedAt(),
                            logs
                    ));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{orderId}/saga-logs")
    public ResponseEntity<List<SagaLog>> getSagaLogs(@PathVariable String orderId) {
        return ResponseEntity.ok(sagaLogRepository.findByOrderIdOrderByIdAsc(orderId));
    }
}
