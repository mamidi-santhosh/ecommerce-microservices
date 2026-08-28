# 📦 LESSON 8: COMPLETE SYSTEM SOURCE CODE DUMP

> **Purpose**: A single self-contained document containing all key source code, configurations, POM files, Docker Compose, and React UI components formatted for easy feeding into LLMs (Gemini / Claude).

---

## 📄 1. DOCKER COMPOSE CONFIGURATION (`docker-compose.yml`)

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: ecommerce-mysql
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: ecommerce_db
    volumes:
      - mysql_data:/var/lib/mysql

  redis:
    image: redis:7.0-alpine
    container_name: ecommerce-redis
    ports:
      - "6379:6379"

  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    container_name: ecommerce-zookeeper
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    ports:
      - "2181:2181"

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    container_name: ecommerce-kafka
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1

volumes:
  mysql_data:
```

---

## 📄 2. EUREKA SERVER (`eureka-server`)

```java
// EurekaServerApplication.java
package com.ecommerce.eureka;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

@SpringBootApplication
@EnableEurekaServer
public class EurekaServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(EurekaServerApplication.class, args);
    }
}
```

---

## 📄 3. API GATEWAY (`api-gateway`)

```java
// AuthenticationFilter.java
package com.ecommerce.gateway.filter;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
public class AuthenticationFilter implements GlobalFilter, Ordered {

    private final JwtValidator jwtValidator;

    private static final List<String> PUBLIC_ENDPOINTS = List.of(
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/refresh",
            "/api/products"
    );

    public AuthenticationFilter(JwtValidator jwtValidator) {
        this.jwtValidator = jwtValidator;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();

        if (PUBLIC_ENDPOINTS.stream().anyMatch(path::startsWith)) {
            return chain.filter(exchange);
        }

        if (!request.getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        String token = authHeader.substring(7);
        if (!jwtValidator.validateToken(token)) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        String username = jwtValidator.extractUsername(token);
        String role = jwtValidator.extractRole(token);

        ServerHttpRequest modifiedRequest = request.mutate()
                .header("X-User-Email", username != null ? username : "anonymous")
                .header("X-User-Role", role != null ? role : "ROLE_USER")
                .build();

        return chain.filter(exchange.mutate().request(modifiedRequest).build());
    }

    @Override
    public int getOrder() {
        return -1;
    }
}
```

---

## 📄 4. AUTH SERVICE (`auth-service`)

```java
// AuthService.java
package com.ecommerce.auth.service;

import com.ecommerce.auth.dto.*;
import com.ecommerce.auth.model.RefreshToken;
import com.ecommerce.auth.model.User;
import com.ecommerce.auth.repository.RefreshTokenRepository;
import com.ecommerce.auth.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, RefreshTokenRepository refreshTokenRepository, JwtService jwtService) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered!");
        }

        User user = new User(null, request.getEmail(), request.getPassword(), request.getName(), "ROLE_USER");
        userRepository.save(user);

        String accessToken = jwtService.generateToken(user.getEmail(), user.getRole());
        RefreshToken refreshToken = createRefreshToken(user.getEmail());

        return new AuthResponse(accessToken, refreshToken.getToken(), user.getEmail(), user.getRole(), "User registered successfully!");
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!user.getPassword().equals(request.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        String accessToken = jwtService.generateToken(user.getEmail(), user.getRole());
        RefreshToken refreshToken = createRefreshToken(user.getEmail());

        return new AuthResponse(accessToken, refreshToken.getToken(), user.getEmail(), user.getRole(), "Login successful!");
    }

    @Transactional
    public AuthResponse refreshToken(RefreshRequest request) {
        RefreshToken token = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new RuntimeException("Invalid refresh token"));

        if (token.isRevoked() || token.getExpiryDate().isBefore(Instant.now())) {
            throw new RuntimeException("Refresh token expired or revoked");
        }

        User user = userRepository.findByEmail(token.getUserEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String newAccessToken = jwtService.generateToken(user.getEmail(), user.getRole());
        return new AuthResponse(newAccessToken, token.getToken(), user.getEmail(), user.getRole(), "Token refreshed successfully!");
    }

    @Transactional
    public void logout(String refreshToken) {
        refreshTokenRepository.findByToken(refreshToken).ifPresent(token -> {
            token.setRevoked(true);
            refreshTokenRepository.delete(token);
        });
    }

    private RefreshToken createRefreshToken(String email) {
        RefreshToken token = new RefreshToken(
                UUID.randomUUID().toString(),
                email,
                Instant.now().plus(7, ChronoUnit.DAYS),
                false
        );
        return refreshTokenRepository.save(token);
    }
}
```

---

## 📄 5. ORDER SERVICE & SAGA ORCHESTRATOR (`order-service`)

```java
// SagaOrchestrator.java
package com.ecommerce.order.saga;

import com.ecommerce.order.client.InventoryClient;
import com.ecommerce.order.client.PaymentClient;
import com.ecommerce.order.dto.ClientDTOs.*;
import com.ecommerce.order.dto.*;
import com.ecommerce.order.event.OrderEvent;
import com.ecommerce.order.event.OrderEventProducer;
import com.ecommerce.order.model.*;
import com.ecommerce.order.repository.*;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
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
        logSagaStep(orderId, "CREATE_ORDER", "COMPLETED", "Saved order to local DB with status PENDING");

        // STEP 2: Inter-Service Feign Call - Reserve Stock
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

        // STEP 3: Inter-Service Call + Resilience4j @CircuitBreaker - Process Payment
        logSagaStep(orderId, "PROCESS_PAYMENT", "STARTED", "Charging credit card via Payment Service");
        PaymentResponse paymentResponse = executePaymentWithCircuitBreaker(orderId, request);

        if (!paymentResponse.isSuccess()) {
            logSagaStep(orderId, "PROCESS_PAYMENT", "FAILED", "Payment failed: " + paymentResponse.getMessage());

            // SAGA COMPENSATION STEP: Rollback Inventory Reservation!
            logSagaStep(orderId, "COMPENSATE_INVENTORY", "STARTED", "Triggering Saga Compensation: Releasing stock");
            try {
                inventoryClient.releaseStock(new ReservationRequest(orderId, request.getSku(), request.getQuantity()));
                logSagaStep(orderId, "COMPENSATE_INVENTORY", "COMPENSATED", "Stock compensation completed successfully.");
            } catch (Exception e) {
                logSagaStep(orderId, "COMPENSATE_INVENTORY", "FAILED", "Compensation error: " + e.getMessage());
            }

            order.setStatus("CIRCUIT_OPEN".equals(paymentResponse.getStatus()) ? OrderStatus.CANCELLED_CIRCUIT_OPEN : OrderStatus.CANCELLED_PAYMENT_FAILED);
            orderRepository.save(order);
            return buildOrderResponse(order, orderId);
        }

        // STEP 4: Confirm Order & Publish Kafka Event
        order.setStatus(OrderStatus.CONFIRMED);
        orderRepository.save(order);
        logSagaStep(orderId, "CONFIRM_ORDER", "COMPLETED", "Saga Orchestration Complete! Order CONFIRMED.");

        OrderEvent event = new OrderEvent(orderId, order.getCustomerEmail(), order.getSku(), order.getQuantity(), order.getTotalAmount(), order.getStatus().name(), "Order confirmed", LocalDateTime.now());
        orderEventProducer.sendOrderEvent(event);
        logSagaStep(orderId, "KAFKA_EVENT_PUBLISHED", "DISPATCHED", "Published OrderEvent to Kafka topic [order-events-topic]");

        return buildOrderResponse(order, orderId);
    }

    @CircuitBreaker(name = "paymentServiceCircuitBreaker", fallbackMethod = "paymentCircuitBreakerFallback")
    public PaymentResponse executePaymentWithCircuitBreaker(String orderId, OrderRequest request) {
        return paymentClient.processPayment(new PaymentRequest(
                orderId, request.getAmount(), request.getPaymentMethod(), request.isSimulatePaymentFailure()
        ));
    }

    public PaymentResponse paymentCircuitBreakerFallback(String orderId, OrderRequest request, Throwable throwable) {
        return new PaymentResponse(false, null, orderId, request.getAmount(), "Circuit Breaker OPEN: " + throwable.getMessage(), "CIRCUIT_OPEN");
    }

    private void logSagaStep(String orderId, String stepName, String status, String details) {
        SagaLog log = new SagaLog(null, orderId, stepName, status, details, LocalDateTime.now());
        sagaLogRepository.save(log);
    }

    private OrderResponse buildOrderResponse(Order order, String orderId) {
        List<SagaLog> logs = sagaLogRepository.findByOrderIdOrderByIdAsc(orderId);
        return new OrderResponse(order.getOrderId(), order.getCustomerEmail(), order.getSku(), order.getQuantity(), order.getTotalAmount(), order.getStatus(), order.getFailureReason(), order.getCreatedAt(), logs);
    }
}
```

---
*End of Lesson 8: Complete System Source Code Dump*
