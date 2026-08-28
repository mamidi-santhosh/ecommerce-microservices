# 📱 MOBILE STUDY NOTES & E-COMMERCE MICROSERVICES ARCHITECTURE
> **6-Day Mastery Guide & Real-Time Production Architecture**
> 
> *Designed with compact ASCII diagrams, high-contrast callouts, Redis integration, JWT Access/Refresh Token Security, complete step-by-step endpoint breakdowns, and under-the-hood execution flows.*

---

## 🎯 6-DAY MASTERY ROADMAP OVERVIEW

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
  │ DAY 5: Redis Caching, Distributed Locks & API Flow     │
  ├─────────────────────────────────────────────────────────┤
  │ DAY 6: JWT Security (Access & Refresh Tokens + Logout)  │
  └─────────────────────────────────────────────────────────┘
```

---

# 🏗️ SYSTEM ARCHITECTURE WITH AUTH & REDIS

### High-Level Topology Diagram (Mobile Screen Layout)

```
       📱 React Mobile/Web Frontend (Port 3000)
                        │
                        │ HTTP / REST + Authorization: Bearer <JWT>
                        ▼
      ┌───────────────────────────────────┐
      │  ⚡ API GATEWAY (Port 8080)        │
      │  • Route Dispatching              │
      │  • Global JWT Authentication      │
      └─────────────────┬─────────────────┘
                        │
      ┌─────────────────┴─────────────────┐
      │  🔎 EUREKA SERVER (Port 8761)      │
      │  • Service Registration & Discovery│
      └─────────────────┬─────────────────┘
                        │
   ┌────────────────────┼────────────────────┬────────────────────┐
   │ Feign Client       │ Feign Client       │ Feign Client       │
   ▼                    ▼                    ▼                    ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ 🔐 AUTH      │   │ 🛒 ORDER     │   │ 📦 INVENTORY │   │ 💳 PAYMENT   │
│ SERVICE      │   │ SERVICE      │──▶│ SERVICE      │   │ SERVICE      │
│ (Port 8085)  │   │ (Port 8081)  │   │ (Port 8082)  │   │ (Port 8083)  │
│ [Tokens DB]  │   │ [Saga Master]│   │ [Stock DB]   │   │ [Gateway DB] │
└──────────────┘   └──────┬───────┘   └──────┬───────┘   └──────────────┘
                          │                  │
                          │ @Async           ▼
                          ▼           ┌──────────────┐
                   ┌──────────────┐   │ 🟥 REDIS     │
                   │ 🔔 NOTIFY    │   │ (Port 6379)  │
                   │ SERVICE      │   │ • Cache      │
                   │ (Port 8084)  │   │ • Lock (SKU) │
                   └──────────────┘   └──────────────┘
```

### Complete System Services & Port Reference Table

| Service | Port | Key Role / Responsibility |
| :--- | :--- | :--- |
| `eureka-server` | `8761` | Central Service Registry & Heartbeat Monitor |
| `api-gateway` | `8080` | Entry Point, Route Rules, Global JWT Filter, CORS |
| `auth-service` | `8085` | User Registration, Login, Access & Refresh Token Management |
| `order-service` | `8081` | Saga Master, Feign Dispatcher, Resilience4j, Saga Logs |
| `inventory-service`| `8082` | Stock Reservation, Redis Lock, Release Compensation |
| `payment-service` | `8083` | Payment Processing & Failure Simulation |
| `notification-service`| `8084` | Asynchronous Email / SMS Alert Dispatcher |
| `redis` | `6379` | Cache-Aside Product Data & Distributed Locking |
| `frontend-react` | `3000` | Real-time UI, Auth Modal & Saga Execution Visualizer |

---

# 🎭 IN-DEPTH SAGA ORCHESTRATOR CODE & FLOW BREAKDOWN

### 📌 1. What is an Orchestration Saga?
In a microservices architecture, an **Orchestrator Saga** uses a central service (`order-service` via [`SagaOrchestrator.java`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/order-service/src/main/java/com/ecommerce/order/saga/SagaOrchestrator.java#L27-L179)) to act as a "master controller". It explicitly dispatches REST commands to participant services (`inventory-service`, `payment-service`, `notification-service`) and evaluates responses to decide whether to proceed or execute **compensating transactions** to rollback previous steps.

---

### 📌 2. Code Components Map

| Component | File Link | Description & Role |
| :--- | :--- | :--- |
| **REST Entrypoint** | [`OrderController.java`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/order-service/src/main/java/com/ecommerce/order/controller/OrderController.java#L34-L41) | Receives HTTP `POST /api/orders` and delegates to `sagaOrchestrator.executeOrderSaga(request)`. |
| **Saga Orchestrator** | [`SagaOrchestrator.java`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/order-service/src/main/java/com/ecommerce/order/saga/SagaOrchestrator.java#L47-L135) | Main transactional workflow engine managing state transitions & rollbacks. |
| **Order Domain Entity** | [`Order.java`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/order-service/src/main/java/com/ecommerce/order/model/Order.java) | Entity storing order state (`PENDING`, `INVENTORY_RESERVED`, `CONFIRMED`, `CANCELLED_*`). |
| **Saga Audit Log** | [`SagaLog.java`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/order-service/src/main/java/com/ecommerce/order/model/SagaLog.java) | Audit log record persisted for live visualizer tracking. |
| **Inventory Feign Client** | [`InventoryClient.java`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/order-service/src/main/java/com/ecommerce/order/client/InventoryClient.java#L10-L17) | OpenFeign interface for stock reservation (`/reserve`) & stock release (`/release`). |
| **Payment Feign Client** | [`PaymentClient.java`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/order-service/src/main/java/com/ecommerce/order/client/PaymentClient.java#L10-L14) | OpenFeign interface for charging payments (`/process`). |
| **Notification Client** | [`NotificationClient.java`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/order-service/src/main/java/com/ecommerce/order/client/NotificationClient.java) | Async Feign interface for sending email alerts. |

---

### 📌 3. Detailed Line-by-Line Mechanics

#### Phase 1: Saga Initialization & Local Order Creation (Status: `PENDING`)
* **Code Reference**: [`SagaOrchestrator.java` L47-L68](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/order-service/src/main/java/com/ecommerce/order/saga/SagaOrchestrator.java#L47-L68)
* **Execution**:
  1. The method is annotated with `@Transactional`, creating a local database transaction boundary for `order-service`.
  2. Generates a unique tracking ID: `ORD-8F2A1C90` via `UUID.randomUUID()`.
  3. Instantiates an `Order` object with status `OrderStatus.PENDING`.
  4. Persists the record into MySQL DB via `orderRepository.save(order)`.
  5. Records an audit trail log via `logSagaStep(orderId, "CREATE_ORDER", "COMPLETED", ...)` into the `saga_log` table.

---

#### Phase 2: Inter-Service Stock Reservation via OpenFeign (Status: `INVENTORY_RESERVED`)
* **Code Reference**: [`SagaOrchestrator.java` L69-L92](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/order-service/src/main/java/com/ecommerce/order/saga/SagaOrchestrator.java#L69-L92)
* **Execution**:
  1. Dispatches a REST call via [`inventoryClient.reserveStock(...)`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/order-service/src/main/java/com/ecommerce/order/client/InventoryClient.java#L12-L13) to `inventory-service` (Port 8082).
  2. `inventory-service` acquires a **Redis Distributed Lock** (`lock:sku:PROD-NEO-01`), verifies stock, deducts quantity, evicts Redis cache, and returns `InventoryResponse`.
  3. **Network Fail-Safe**: If `inventory-service` is unreachable, `catch (Exception e)` sets `OrderStatus.CANCELLED_OUT_OF_STOCK` and halts the saga.
  4. **Stock Validation**: If `inventoryResponse.isSuccess()` is `false`, sets `OrderStatus.CANCELLED_OUT_OF_STOCK` and exits.
  5. **Success Transition**: Order status advances to `OrderStatus.INVENTORY_RESERVED`.

---

#### Phase 3: Resilience4j Circuit Breaker Payment Execution
* **Code Reference**: [`SagaOrchestrator.java` L94-L96](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/order-service/src/main/java/com/ecommerce/order/saga/SagaOrchestrator.java#L94-L96) & [`SagaOrchestrator.java` L137-L157](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/order-service/src/main/java/com/ecommerce/order/saga/SagaOrchestrator.java#L137-L157)
* **Execution**:
  1. Calls helper `executePaymentWithCircuitBreaker(...)` annotated with `@CircuitBreaker(name = "paymentServiceCircuitBreaker", fallbackMethod = "paymentCircuitBreakerFallback")`.
  2. If normal (`CLOSED`), [`paymentClient.processPayment(...)`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/order-service/src/main/java/com/ecommerce/order/client/PaymentClient.java#L12-L13) executes HTTP `POST /api/payments/process`.
  3. If `payment-service` is failing >50% of calls, Resilience4j **trips the circuit to `OPEN`** and instantly invokes `paymentCircuitBreakerFallback(...)` without waiting for network timeouts.

---

#### Phase 4: Saga Compensation Trigger (Rollback Step)
* **Code Reference**: [`SagaOrchestrator.java` L98-L118](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/order-service/src/main/java/com/ecommerce/order/saga/SagaOrchestrator.java#L98-L118)
* **Execution**:
  1. If `paymentResponse.isSuccess()` is `false`, the Orchestrator detects that a previous step (Inventory Reservation) succeeded and **MUST BE UNDONE**.
  2. **Compensating Action**: Dispatches a Feign call:
     ```java
     inventoryClient.releaseStock(new ReservationRequest(orderId, request.getSku(), request.getQuantity()));
     ```
  3. `inventory-service` receives `/api/inventory/release`, adds quantity back (+1) in MySQL DB and updates Redis cache.
  4. Updates order status to `OrderStatus.CANCELLED_PAYMENT_FAILED` or `OrderStatus.CANCELLED_CIRCUIT_OPEN`.

---

#### Phase 5: Saga Confirmation & Async Notification (Status: `CONFIRMED`)
* **Code Reference**: [`SagaOrchestrator.java` L120-L134](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/order-service/src/main/java/com/ecommerce/order/saga/SagaOrchestrator.java#L120-L134)
* **Execution**:
  1. Order status transitions to `OrderStatus.CONFIRMED`.
  2. Dispatches non-blocking `@Async` call to [`notificationClient.sendNotification(...)`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/order-service/src/main/java/com/ecommerce/order/client/NotificationClient.java).
  3. Returns HTTP `200 OK` with full `OrderResponse` containing all `SagaLog` steps for the UI visualizer.

---

# 🔄 UNDER-THE-HOOD COMPLETE END-TO-END EXECUTION FLOWS

---

## ⚡ FLOW 1: USER LOGIN & JWT ISSUANCE FLOW

```
[React Client] ──(1) POST /api/auth/login──▶ [API Gateway :8080]
                                                     │
                           (2) Eureka IP Resolution  │
                           lb://auth-service         ▼
                                             [Auth Service :8085]
                                                     │
                           (3) Query DB & Password   │
                           Verification              ▼
                                             [JwtService]
                                                     │
                           (4) Generate AccessToken  │ (15 mins)
                           Generate RefreshToken     ▼ (7 days in DB)
[Store Tokens in LocalStorage] ◀──(5) AuthResponse HTTP 200──┘
```

---

## ⚡ FLOW 2: PROTECTED SAGA CHECKOUT EXECUTION (SUCCESS)

```
[React Client] ──(1) POST /api/orders (Authorization: Bearer <AccessToken>)──▶ [API Gateway :8080]
                                                                                      │
                                   (2) Validate JWT Signature & Expiry               │
                                   Inject Header: X-User-Email                       ▼
                                                                             [Order Service :8081]
                                                                                      │
                                   (3) Local DB Save: Order PENDING                  │
                                   Saga Log: [CREATE_ORDER]                          ▼
                                                                             [Saga Orchestrator]
                                                                                      │
                                   (4) Feign Call: reserveStock()                    │
                                   Redis Lock: lock:sku:PROD-NEO-01                  ▼
                                                                             [Inventory Service :8082]
                                                                                      │
                                   (5) Feign Call: processPayment()                  │
                                   Resilience4j @CircuitBreaker (CLOSED)             ▼
                                                                             [Payment Service :8083]
                                                                                      │
                                   (6) Payment Success (TX-99182)                    │
                                   Update Order Status -> CONFIRMED                  ▼
                                                                             [Decision Point: SUCCESS]
                                                                              /                     \
                                                                    (Async)  /                       \ (HTTP 200)
                                                                            v                         v
                                                                    [Notification Svc :8084]    [React UI]
```

---

## ⚡ FLOW 3: FAILURE & SAGA COMPENSATING TRANSACTION FLOW

```
[Saga Step 1: Order PENDING] ──▶ [Saga Step 2: Stock Reserved (50 -> 49)]
                                                │
                                                ▼
                                  [Saga Step 3: Payment Processed]
                                                │
                                       ❌ Payment Declined!
                                                │
                                                ▼
                                  [SAGA ORCHESTRATOR DETECTS FAILURE]
                                                │
       ┌────────────────────────────────────────┴────────────────────────────────────────┐
       │                                                                                 │
       ▼                                                                                 ▼
[1. Call Inventory Release Stock]                                            [2. Update Order Entity]
  • Feign -> POST /api/inventory/release                                       • Status: CANCELLED_PAYMENT_FAILED
  • Inventory Service Restocks (+1)                                            • Failure Reason: "Declined Card"
  • Stock returned: 49 -> 50 🔄                                                • Save to MySQL DB
```

---

# 📚 STEP-BY-STEP COMPLETE ENDPOINT DOCUMENTATION

Below is the complete, detailed step-by-step breakdown of **EVERY SINGLE ENDPOINT** across all 6 microservices in this project.

---

## 🔑 1. AUTHENTICATION SERVICE (`auth-service` - Port 8085)

### 1.1 `POST /api/auth/register`
* **Purpose**: Registers a new user account.
* **Public/Protected**: Public Endpoint.

---

### 1.2 `POST /api/auth/login`
* **Purpose**: Authenticates credentials and issues JWT tokens.
* **Public/Protected**: Public Endpoint.

---

### 1.3 `POST /api/auth/refresh`
* **Purpose**: Exchanges a valid Refresh Token for a new Access Token.

---

### 1.4 `POST /api/auth/logout`
* **Purpose**: Revokes & deletes Refresh Token from database.

---

### 1.5 `GET /api/auth/validate`
* **Purpose**: Utility endpoint to verify if an Access Token is valid.

---

## 🛒 2. ORDER SERVICE (`order-service` - Port 8081)

### 2.1 `POST /api/orders`
* **Purpose**: Initiates the Distributed Checkout Saga via [`SagaOrchestrator.java`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/order-service/src/main/java/com/ecommerce/order/saga/SagaOrchestrator.java#L47-L135).

---

### 2.2 `GET /api/orders/{orderId}`
* **Purpose**: Retrieves order details and audit logs for visualizer.

---

## 📦 3. INVENTORY SERVICE (`inventory-service` - Port 8082)

### 3.1 `GET /api/products`
* **Purpose**: Returns product catalog (Redis Cache-Aside).

---

### 3.2 `POST /api/inventory/reserve`
* **Purpose**: Reserves stock using Redis Distributed Lock `lock:sku`.

---

### 3.3 `POST /api/inventory/release`
* **Purpose**: Compensating Transaction (Restores stock if payment fails).

---

## 💳 4. PAYMENT SERVICE (`payment-service` - Port 8083)

### 4.1 `POST /api/payments/process`
* **Purpose**: Processes credit card payment (Resilience4j `@CircuitBreaker` protected).

---

## 🔔 5. NOTIFICATION SERVICE (`notification-service` - Port 8084)

### 5.1 `POST /api/notifications/send`
* **Purpose**: Sends non-blocking `@Async` order confirmation email.

---

# 🧠 REVISION CHEAT SHEET

```
┌─────────────────────────┬───────────────────────────────────────────────────────────┐
│ CONCEPT                 │ ONE-LINE REVISION SUMMARY                                 │
├─────────────────────────┼───────────────────────────────────────────────────────────┤
│ Saga Orchestrator       │ Central controller directing transaction steps & rollbacks │
│ Compensating Action     │ Feign `releaseStock()` call executed when later step fails│
│ Circuit Breaker         │ Resilience4j trip mechanism (CLOSED -> OPEN -> HALF_OPEN).│
│ Access Token            │ Short-lived (15m) JWT sent in `Authorization: Bearer` hdr.│
│ Refresh Token           │ Long-lived (7d) token stored in DB used to get new Access.│
└─────────────────────────┴───────────────────────────────────────────────────────────┘
```

---
*Complete 6-Day Mastery Notes with In-Depth Saga Orchestrator Code & Flow Breakdown.*
