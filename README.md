# 📱 MOBILE STUDY NOTES & E-COMMERCE MICROSERVICES ARCHITECTURE
> **5-Day Mastery Guide & Real-Time Production Architecture**
> 
> *Designed with compact ASCII diagrams, high-contrast callouts, Redis integration, and line-by-line API execution flows.*

---

## 🎯 5-DAY MASTERY ROADMAP OVERVIEW

```
  ┌─────────────────────────────────────────────────────────┐
  │ DAY 1: Architecture Blueprint & Eureka Service Discovery│
  ├─────────────────────────────────────────────────────────┤
  │ DAY 2: API Gateway Routing, CORS & Load Balancing       │
  ├─────────────────────────────────────────────────────────┤
  │ DAY 3: Distributed Transactions & Deep Saga Orchestration│
  ├─────────────────────────────────────────────────────────┤
  │ DAY 4: Resilience4j Circuit Breaker & OpenFeign         │
  ├─────────────────────────────────────────────────────────┤
  │ DAY 5: Redis Caching, Distributed Locks & API Flow    │
  └─────────────────────────────────────────────────────────┘
```

---

# 🏗️ SYSTEM ARCHITECTURE WITH REDIS INTEGRATION

### High-Level Topology Diagram

```
       📱 React Mobile/Web Frontend (Port 3000)
                        │
                        │ HTTP / REST
                        ▼
      ┌───────────────────────────────────┐
      │  ⚡ API GATEWAY (Port 8080)        │
      │  • Route Dispatching              │
      │  • CORS Handling                  │
      └─────────────────┬─────────────────┘
                        │
      ┌─────────────────┴─────────────────┐
      │  🔎 EUREKA SERVER (Port 8761)      │
      │  • Service Registration & Discovery│
      └─────────────────┬─────────────────┘
                        │
   ┌────────────────────┼────────────────────┐
   │ Feign Client       │ Feign Client       │ Feign Client
   ▼                    ▼                    ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ 🛒 ORDER     │   │ 📦 INVENTORY │   │ 💳 PAYMENT   │
│ SERVICE      │──▶│ SERVICE      │   │ SERVICE      │
│ (Port 8081)  │   │ (Port 8082)  │   │ (Port 8083)  │
│ [Saga Master]│   │ [Stock DB]   │   │ [Gateway DB] │
└──────┬───────┘   └──────┬───────┘   └──────────────┘
       │                  │
       │ @Async           ▼
       ▼           ┌──────────────┐
┌──────────────┐   │ 🟥 REDIS     │
│ 🔔 NOTIFY    │   │ (Port 6379)  │
│ SERVICE      │   │ • Cache      │
│ (Port 8084)  │   │ • Lock (SKU) │
└──────────────┘   └──────────────┘
```

### System Services & Port Reference Table

| Service | Port | Key Role / Responsibility |
| :--- | :--- | :--- |
| `eureka-server` | `8761` | Central Service Registry & Heartbeat Monitor |
| `api-gateway` | `8080` | Unified Entry Point, Route Rules, CORS, Netty Loop |
| `order-service` | `8081` | Saga Master, Feign Dispatcher, Resilience4j, Saga Logs |
| `inventory-service`| `8082` | Stock Reservation, Redis Lock, Release Compensation |
| `payment-service` | `8083` | Payment Processing & Failure Simulation |
| `notification-service`| `8084` | Asynchronous Email / SMS Alert Dispatcher |
| `redis` | `6379` | Cache-Aside Product Data & Distributed Locking |
| `frontend-react` | `3000` | Real-time UI & Live Saga Execution Visualizer |

---

# 📆 DAY 1: MICROSERVICES FOUNDATION & EUREKA SERVICE DISCOVERY

### 💡 Core Concept: Monolith vs. Microservices

> 📱 **Handwritten Note**: In a **Monolith**, everything lives in one big JVM process. If Payment fails, the entire site crashes! In **Microservices**, each domain (Order, Stock, Payment) is an independent Spring Boot application. If Payment goes down, Order can gracefully catch it!

### 🔍 How Eureka Service Discovery Works

In traditional apps, Service A calls Service B using hardcoded URLs like `http://192.168.1.50:8082`. 
**Problem**: In real cloud deployments, IP addresses change dynamically!

**Solution**: **Netflix Eureka (Service Registry)**.
1. Every service registers itself with Eureka when starting up.
2. Order Service doesn't call an IP address—it asks Eureka: *"Where is INVENTORY-SERVICE?"*
3. Eureka hands back the healthy instance IP and Port!

```
 ┌────────────────┐              ┌────────────────┐
 │ Inventory App  │─1. Register─▶│ Eureka Server  │
 │ (IP 10.0.0.12) │              │ (Port 8761)    │
 └────────────────┘              └───────▲────────┘
                                         │ 2. Lookup
 ┌────────────────┐                      │    "INVENTORY"
 │ Order Service  │──────────────────────┘
 └────────────────┘
```

### 🧑‍💻 Code Walkthrough: Eureka Setup

#### 1. Server Configuration (`eureka-server`)
```java
// EurekaServerApplication.java
@SpringBootApplication
@EnableEurekaServer // 👈 Turns this app into a Service Registry!
public class EurekaServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(EurekaServerApplication.class, args);
    }
}
```

```yaml
# eureka-server application.yml
server:
  port: 8761
eureka:
  client:
    registerWithEureka: false # Server doesn't register with itself
    fetchRegistry: false
```

#### 2. Client Registration (`order-service`, `inventory-service`, etc.)
```yaml
# application.yml in Order Service
server:
  port: 8081
spring:
  application:
    name: order-service # 👈 Eureka registry ID (lowercase)

eureka:
  client:
    serviceUrl:
      defaultZone: http://localhost:8761/eureka/
```

---

# 📆 DAY 2: API GATEWAY ROUTING, CORS & LOAD BALANCING

### 💡 Core Concept: API Gateway Pattern

> 📱 **Handwritten Note**: Clients (Mobile App / Web) should NEVER call 5 different microservice ports directly. They talk to ONE front door: the **API Gateway** on Port `8080`.

### ⚙️ What the Gateway Handles:
1. **Routing**: Directs `/api/orders/**` to `order-service`.
2. **Dynamic Load Balancing**: Uses `lb://` prefix via Eureka registry.
3. **Global CORS**: Allows React Frontend (`localhost:3000`) to call backend endpoints without browser blocking.

```
 Client Request: POST http://localhost:8080/api/orders/checkout
                       │
                       ▼
 ┌───────────────────────────────────────────────────────────┐
 │ API GATEWAY (Port 8080)                                    │
 │ Route Match: Path=/api/orders/**                         │
 │ Target: lb://order-service                                │
 └─────────────────────┬─────────────────────────────────────┘
                       │ Eureka Lookup: "order-service" -> Port 8081
                       ▼
          ORDER-SERVICE (Port 8081)
```

### 🧑‍💻 Code Walkthrough: API Gateway Config

```yaml
# api-gateway/src/main/resources/application.yml
server:
  port: 8080

spring:
  cloud:
    gateway:
      discovery:
        locator:
          enabled: true
          lower-case-service-id: true
      globalcors:
        cors-configurations:
          '[/**]':
            allowedOrigins: "*"
            allowedMethods: [GET, POST, PUT, DELETE, OPTIONS]
      routes:
        - id: order-service
          uri: lb://order-service # 👈 Load balances using Eureka
          predicates:
            - Path=/api/orders/**

        - id: inventory-service
          uri: lb://inventory-service
          predicates:
            - Path=/api/products/**, /api/inventory/**
```

---

# 📆 DAY 3: DISTRIBUTED TRANSACTIONS & SAGA ORCHESTRATOR DEEP DIVE

### 💡 Core Concept: Why Traditional ACID Transactions Fail

> 📱 **Handwritten Note**: In a monolith, you use `@Transactional` over one database. But in microservices, Order DB, Inventory DB, and Payment DB are separate! You cannot use a single SQL `COMMIT` or `ROLLBACK` across 3 different databases.

### 🎭 The Solution: Saga Pattern (Orchestration-Based)

Instead of a two-phase commit (2PC) which blocks databases, the **Saga Pattern** breaks the transaction into local steps. If step 3 fails, the Saga Orchestrator executes **Compensating Transactions** (rollback steps) in reverse order!

```
 SUCCESSFUL SAGA FLOW:
 [1. Save Order] ──▶ [2. Reserve Stock] ──▶ [3. Process Payment] ──▶ [4. Confirm Order]

 FAILURE SAGA FLOW (Payment Fails):
 [1. Save Order] ──▶ [2. Reserve Stock] ──▶ [3. Process Payment ❌]
                           │
                           ▼ Trigger Compensation!
                     [Undo 2: Release Stock 🔄] ──▶ [Cancel Order ❌]
```

---

## 🔍 DEEP DIVE: LINE-BY-LINE SAGA ORCHESTRATOR ANALYSIS

Let's dissect `SagaOrchestrator.java` step by step:

```java
@Service
public class SagaOrchestrator {

    private final OrderRepository orderRepository;
    private final SagaLogRepository sagaLogRepository;
    private final InventoryClient inventoryClient;
    private final PaymentClient paymentClient;
    private final NotificationClient notificationClient;

    @Transactional
    public OrderResponse executeOrderSaga(OrderRequest request) {
        String orderId = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
```
* **Line `@Transactional`**: Enforces a local MySQL transaction for writing the initial Order record and Saga Logs within `order-service`.
* **Line `orderId` Generation**: Generates a unique traceable order tracking code (`ORD-A1B2C3D4`) used across all microservices for correlation.

---

### 📌 Saga Step 1: Initial Local Order Creation
```java
        // STEP 1: Save local Order in PENDING status
        Order order = new Order(
                null, orderId, request.getCustomerEmail(),
                request.getSku(), request.getQuantity(), request.getAmount(),
                OrderStatus.PENDING, null, LocalDateTime.now()
        );
        orderRepository.save(order);
        logSagaStep(orderId, "CREATE_ORDER", "COMPLETED", "Saved order to local MySQL with status PENDING");
```
* **Why PENDING?**: The order is not yet confirmed. It is in a tentative state until inventory & payment pass.
* **Audit Trail**: `logSagaStep()` writes a row into `saga_log` table for UI live visualization!

---

### 📌 Saga Step 2: Reserve Stock in Inventory Service
```java
        // STEP 2: Call Inventory Service via Feign
        logSagaStep(orderId, "RESERVE_INVENTORY", "STARTED", "Dispatching Feign request to Inventory Service");
        InventoryResponse inventoryResponse;
        try {
            inventoryResponse = inventoryClient.reserveStock(
                new ReservationRequest(orderId, request.getSku(), request.getQuantity())
            );
        } catch (Exception e) {
            logSagaStep(orderId, "RESERVE_INVENTORY", "FAILED", "Inventory service Feign call failed: " + e.getMessage());
            order.setStatus(OrderStatus.CANCELLED_OUT_OF_STOCK);
            order.setFailureReason("Inventory service unavailable or stock check error");
            orderRepository.save(order);
            return buildOrderResponse(order, orderId);
        }
```
* **Inter-Service Communication**: `inventoryClient.reserveStock(...)` dispatches a REST call over Feign to `inventory-service:8082`.
* **Network Fail-Safe**: If `inventory-service` is down, `catch (Exception e)` sets `CANCELLED_OUT_OF_STOCK` and stops the saga immediately without calling Payment!

```java
        if (!inventoryResponse.isSuccess()) {
            logSagaStep(orderId, "RESERVE_INVENTORY", "FAILED", "Stock reservation rejected: " + inventoryResponse.getMessage());
            order.setStatus(OrderStatus.CANCELLED_OUT_OF_STOCK);
            order.setFailureReason(inventoryResponse.getMessage());
            orderRepository.save(order);
            return buildOrderResponse(order, orderId);
        }

        // Inventory Success -> Move state forward!
        order.setStatus(OrderStatus.INVENTORY_RESERVED);
        orderRepository.save(order);
```
* **State Transition**: Order state advances from `PENDING` ──▶ `INVENTORY_RESERVED`.

---

### 📌 Saga Step 3: Process Payment + Resilience4j Circuit Breaker
```java
        // STEP 3: Payment Feign Call + Resilience4j @CircuitBreaker
        logSagaStep(orderId, "PROCESS_PAYMENT", "STARTED", "Dispatching Feign request with @CircuitBreaker");
        PaymentResponse paymentResponse = executePaymentWithCircuitBreaker(orderId, request);
```

```java
        if (!paymentResponse.isSuccess()) {
            logSagaStep(orderId, "PROCESS_PAYMENT", "FAILED", "Payment failed: " + paymentResponse.getMessage());
            
            // 🚨 SAGA COMPENSATING TRANSACTION: Release Reserved Stock!
            logSagaStep(orderId, "COMPENSATE_INVENTORY", "STARTED", "Triggering Saga Compensation: Releasing stock");
            try {
                inventoryClient.releaseStock(
                    new ReservationRequest(orderId, request.getSku(), request.getQuantity())
                );
                logSagaStep(orderId, "COMPENSATE_INVENTORY", "COMPENSATED", "Stock compensation complete: Inventory restocked.");
            } catch (Exception e) {
                logSagaStep(orderId, "COMPENSATE_INVENTORY", "FAILED", "Critical Error: Stock release compensation failed");
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
```

> 📱 **CRITICAL SAGA COMPENSATION LESSON**:
> Notice that when Payment fails, the code doesn't just stop. It explicitly executes `inventoryClient.releaseStock(...)` to put stock back in the inventory database! This guarantees **eventual consistency**.

---

### 📌 Saga Step 4 & 5: Confirmation & Async Notification
```java
        // STEP 4: Confirm Order & Complete Saga
        order.setStatus(OrderStatus.CONFIRMED);
        orderRepository.save(order);
        logSagaStep(orderId, "CONFIRM_ORDER", "COMPLETED", "Saga Orchestration Complete! Order CONFIRMED.");

        // STEP 5: Async Notification Dispatch (Non-Blocking)
        try {
            notificationClient.sendNotification(
                new NotificationRequest(orderId, order.getCustomerEmail(), "Order " + orderId + " confirmed!", "EMAIL")
            );
        } catch (Exception e) {
            System.err.println("Async notification trigger warning: " + e.getMessage());
        }

        return buildOrderResponse(order, orderId);
    }
}
```

---

# 📆 DAY 4: RESILIENCE4J CIRCUIT BREAKER & OPENFEIGN

### 💡 Core Concept: Circuit Breaker Mechanics

> 📱 **Handwritten Note**: If Payment Service is crashing or taking 30 seconds per request, without a Circuit Breaker, all Order Service threads will hang waiting! Resilience4j stops the madness by "opening" the circuit and returning an instant fallback.

```
   ┌───────────────────────────────────────────┐
   │                CLOSED                     │ (Normal Operation: Calls go through)
   └─────────────────────┬─────────────────────┘
                         │ Failure Rate > 50%
                         ▼
   ┌───────────────────────────────────────────┐
   │                 OPEN                      │ (Fast Fail: Calls blocked immediately)
   └─────────────────────┬─────────────────────┘
                         │ Wait Duration (e.g. 10s) Expires
                         ▼
   ┌───────────────────────────────────────────┐
   │               HALF-OPEN                   │ (Trial phase: Send 3 test requests)
   └───────────────────────────────────────────┘
```

### 🧑‍💻 Circuit Breaker Code Implementation

```java
@CircuitBreaker(name = "paymentServiceCircuitBreaker", fallbackMethod = "paymentCircuitBreakerFallback")
public PaymentResponse executePaymentWithCircuitBreaker(String orderId, OrderRequest request) {
    return paymentClient.processPayment(new PaymentRequest(...));
}

// 🛡️ Fallback method executed when Circuit is OPEN or times out!
public PaymentResponse paymentCircuitBreakerFallback(String orderId, OrderRequest request, Throwable t) {
    return new PaymentResponse(
            false, null, orderId, request.getAmount(),
            "Payment Service Circuit Breaker OPEN! Inter-service call tripped: " + t.getMessage(),
            "CIRCUIT_OPEN"
    );
}
```

---

# 📆 DAY 5: REDIS CACHING, DISTRIBUTED LOCKS & COMPLETE API FLOW

### 💡 Core Concept: Why Add Redis?

1. **Redis Cache-Aside Pattern**: Reading product catalog data from MySQL on every homepage view is slow (50-100ms). Caching products in Redis gives sub-millisecond responses (<2ms)!
2. **Redis Distributed Locking (Redlock)**: When 1,000 users click "Buy" on the last iPhone at the exact same millisecond, standard database queries cause race conditions! Redis locks ensure only **one** thread deducts stock at a time.

```
                  ┌─────────────────────────────────┐
                  │ 📱 Client Request: Buy iPhone    │
                  └────────────────┬────────────────┘
                                   │
                                   ▼
                  ┌─────────────────────────────────┐
                  │ 🔒 Redis Lock: "lock:SKU-IPHONE"│
                  │ SET SKU:lock NX PX 5000         │
                  └────────────────┬────────────────┘
                                   │
                     ┌─────────────┴─────────────┐
                     │ Lock Acquired Successfully│
                     ▼                           ▼
        ┌─────────────────────────┐  ┌─────────────────────────┐
        │ Thread 1: Deduct Stock  │  │ Thread 2: Lock Failed!  │
        │ in DB & Redis Cache     │  │ Wait or Fail Fast ⏳    │
        └─────────────────────────┘  └─────────────────────────┘
```

---

## ⚡ REDIS IMPLEMENTATION PATTERNS

### 1. Redis Cache-Aside Pattern (Product Service)

```java
@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    public Product getProductBySku(String sku) {
        String cacheKey = "product:" + sku;

        // 1. Check Redis Cache First (Cache Hit)
        Product cachedProduct = (Product) redisTemplate.opsForValue().get(cacheKey);
        if (cachedProduct != null) {
            System.out.println("⚡ [REDIS CACHE HIT] Returned from memory: " + sku);
            return cachedProduct;
        }

        // 2. Cache Miss -> Query Database
        System.out.println("🐢 [REDIS CACHE MISS] Querying MySQL Database for SKU: " + sku);
        Product productFromDb = productRepository.findBySku(sku)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        // 3. Write to Redis with 10-minute TTL (Time To Live)
        redisTemplate.opsForValue().set(cacheKey, productFromDb, 10, TimeUnit.MINUTES);
        return productFromDb;
    }
}
```

---

### 2. Redis Distributed Lock (Stock Reservation)

```java
@Service
public class InventoryService {

    private final StringRedisTemplate redisTemplate;

    public boolean reserveStockWithLock(String sku, int quantity) {
        String lockKey = "lock:sku:" + sku;
        String requestId = UUID.randomUUID().toString();

        // Try to acquire distributed lock for 5 seconds (NX = Only if Not Exists)
        Boolean lockAcquired = redisTemplate.opsForValue()
            .setIfAbsent(lockKey, requestId, Duration.ofSeconds(5));

        if (Boolean.TRUE.equals(lockAcquired)) {
            try {
                // 🔒 CRITICAL SECTION: Safe atomic stock check & deduction
                return executeStockDeduction(sku, quantity);
            } finally {
                // Unlock safely (only release if value matches our requestId)
                if (requestId.equals(redisTemplate.opsForValue().get(lockKey))) {
                    redisTemplate.delete(lockKey);
                }
            }
        } else {
            System.err.println("⚠️ Could not acquire lock for SKU: " + sku + ". High concurrency collision!");
            return false;
        }
    }
}
```

---

# 🔄 COMPLETE END-TO-END UNDER-THE-HOOD API FLOW

When a user clicks **"Place Order"** in the React App, here is the exact step-by-step execution path:

```
[React App] ──(1) HTTP POST /api/orders/checkout──▶ [API Gateway :8080]
                                                            │
                                  (2) Eureka IP Resolution  │
                                  lb://order-service        ▼
                                                    [Order Service :8081]
                                                            │
                                  (3) Local DB Save         │
                                  Status: PENDING           ▼
                                                    [Saga Orchestrator]
                                                            │
                                  (4) Feign Call            │
                                  reserveStock()            ▼
                                                    [Inventory Service :8082]
                                                            │
                                  (5) Redis Lock & DB       │
                                  Deduct Stock              ▼
                                                    [Payment Service :8083]
                                                            │
                                  (6) Feign Call +          │
                                  CircuitBreakers           ▼
                                                    [Decision Branch]
                                                     /            \
                                          (Success) /              \ (Failure)
                                                   v                v
                                          [CONFIRMED]         [COMPENSATE]
                                           Notify Svc          Release Stock
                                           (:8084)             Status: CANCELLED
```

---

## 🔬 STEP-BY-STEP TECHNICAL BREAKDOWN

### 📍 Phase 1: Client to API Gateway
1. User clicks **"Submit Order"** in React (`App.jsx`).
2. Browser issues an HTTP `POST` request to `http://localhost:8080/api/orders/checkout`.
3. Request lands on **API Gateway (Port 8080)** Netty Event Loop thread.
4. Gateway checks `application.yml` predicate `Path=/api/orders/**` -> matches **`order-service`**.
5. Gateway queries Eureka Client Cache: `"Where is order-service?"` -> Eureka returns `127.0.0.1:8081`.

### 📍 Phase 2: Gateway to Order Service
6. Gateway forwards HTTP request to `http://127.0.0.1:8081/api/orders/checkout`.
7. `OrderController` intercepts request and passes `OrderRequest` DTO to `SagaOrchestrator.executeOrderSaga()`.

### 📍 Phase 3: Saga Execution & Order Initialization
8. `@Transactional` begins on `Order Service` MySQL DB.
9. Order created with ID `ORD-8F2A1C90`, Status = `PENDING`.
10. `SagaLog` entry saved: `[CREATE_ORDER] -> COMPLETED`.

### 📍 Phase 4: Inventory Reservation & Redis
11. `SagaOrchestrator` invokes `inventoryClient.reserveStock(...)` via OpenFeign.
12. Feign translates method call into HTTP `POST http://inventory-service/api/inventory/reserve`.
13. `Inventory Service` acquires Redis Distributed Lock `lock:sku:PHONE-01`.
14. Deducts stock in MySQL DB, evicts old Redis cache `product:PHONE-01`, and releases lock.
15. Order status updated to `INVENTORY_RESERVED`.

### 📍 Phase 5: Payment Processing & Circuit Breaker
16. `SagaOrchestrator` invokes `executePaymentWithCircuitBreaker()`.
17. Resilience4j checks Circuit Status (`CLOSED`).
18. Feign dispatches HTTP `POST http://payment-service/api/payments/process`.
19. `Payment Service` charges card, inserts transaction record, and returns `PaymentResponse`.

### 📍 Phase 6: Saga Resolution
* **If Payment Succeeds**:
  - Order status set to `CONFIRMED`.
  - Log saved: `[CONFIRM_ORDER] -> COMPLETED`.
  - `@Async` request sent to `notification-service:8084` to log email alert.
  - Returns `OrderResponse` (HTTP 200 OK) back through Gateway to React UI.
* **If Payment Fails / Circuit OPEN**:
  - `SagaOrchestrator` catches failure.
  - **Triggers Compensation**: Feign call `inventoryClient.releaseStock(...)`.
  - Inventory Service restores stock in MySQL DB & Redis.
  - Order status set to `CANCELLED_PAYMENT_FAILED` or `CANCELLED_CIRCUIT_OPEN`.
  - Returns `OrderResponse` (HTTP 400 Bad Request) back to React UI.

---

# 🧠 REVISION CHEAT SHEET

```
┌─────────────────────────┬───────────────────────────────────────────────────────────┐
│ CONCEPT                 │ ONE-LINE REVISION SUMMARY                                 │
├─────────────────────────┼───────────────────────────────────────────────────────────┤
│ Eureka Server           │ Service registry on 8761 where services register IP/Ports.│
│ API Gateway             │ Entry point on 8080 routing requests with `lb://`.        │
│ Saga Pattern            │ Manages multi-service transactions via compensating steps.│
│ Saga Orchestrator       │ Central controller directing transaction state & rollbacks│
│ Feign Client            │ Spring declarative HTTP client interface for microservices│
│ Circuit Breaker         │ Prevents cascading failures (CLOSED -> OPEN -> HALF_OPEN).│
│ Compensating Step       │ Action (e.g. stock release) executed when later step fails│
│ Redis Cache-Aside       │ Read Redis first; fallback to DB & write to Redis with TTL│
│ Redis Distributed Lock  │ `SET lock:sku NX PX` prevents concurrent overselling.     │
│ @Async Notification     │ Non-blocking background call for sending email/SMS alerts.│
└─────────────────────────┴───────────────────────────────────────────────────────────┘
```

---
*Spring Boot Microservices E-Commerce Production Architecture.*
