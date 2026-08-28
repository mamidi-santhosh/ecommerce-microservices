# 📱 MOBILE STUDY NOTES & E-COMMERCE MICROSERVICES ARCHITECTURE
> **6-Day Mastery Guide & Real-Time Production Architecture**
> 
> *Designed with compact ASCII diagrams, high-contrast callouts, Redis integration, JWT Access/Refresh Token Security, and complete step-by-step endpoint breakdowns.*

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

### High-Level Topology Diagram

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

# 🔐 DAY 6: JWT SECURITY (ACCESS TOKEN, REFRESH TOKEN & LOGOUT)

### 💡 Core Concept: Dual-Token Architecture

> 📱 **Handwritten Note**: 
> 1. **Access Token (Short-Lived: 15 Mins)**: Sent in `Authorization: Bearer <token>` header with every request. Signed with Secret Key (HMAC-SHA256). API Gateway validates signature locally without calling DB.
> 2. **Refresh Token (Long-Lived: 7 Days)**: Stored securely in database & `localStorage`. Used ONLY to request a new Access Token when expired.
> 3. **Logout Flow**: Revokes and deletes the Refresh Token in the database so no future access tokens can be issued!

---

## 🔄 TOKEN LIFECYCLE & LOGOUT FLOW

```
 ┌───────────────┐                  ┌───────────────┐                  ┌───────────────┐
 │ React Client  │                  │  API Gateway  │                  │ Auth Service  │
 └───────┬───────┘                  └───────┬───────┘                  └───────┬───────┘
         │                                  │                                  │
         │ 1. POST /api/auth/login ─────────┼─────────────────────────────────▶│
         │                                  │                                  │ Generates AccessToken (15m)
         │                                  │                                  │ Generates RefreshToken (7d)
         │ 2. Returns Access + Refresh ◀────┼──────────────────────────────────┤
         │                                  │                                  │
         │ 3. POST /api/orders (Bearer) ───▶│                                  │
         │    (Validates JWT locally)       │── 4. Passes X-User-Email ───────▶[Order Svc]
         │                                  │                                  │
         │ 5. Access Token Expired (401) ──▶│                                  │
         │                                  │                                  │
         │ 6. POST /api/auth/refresh ───────┼─────────────────────────────────▶│ Checks DB & Revoked status
         │ 7. Returns New Access Token ◀────┼──────────────────────────────────┤ Returns New Access Token
         │                                  │                                  │
         │ 8. POST /api/auth/logout ────────┼─────────────────────────────────▶│ Deletes RefreshToken in DB!
         │                                  │                                  │
```

---

# 📚 STEP-BY-STEP COMPLETE ENDPOINT DOCUMENTATION

Below is the complete, detailed step-by-step breakdown of **EVERY SINGLE ENDPOINT** across all 6 microservices in this project.

---

## 🔑 1. AUTHENTICATION SERVICE (`auth-service` - Port 8085)

### 1.1 `POST /api/auth/register`
* **Purpose**: Registers a new user account.
* **Public/Protected**: Public Endpoint.
* **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Demo User"
}
```
* **Step-by-step Flow**:
  1. `AuthController` passes request to `AuthService.register()`.
  2. Checks `UserRepository` to verify if email already exists.
  3. Saves `User` entity to database with default role `ROLE_USER`.
  4. Calls `JwtService.generateAccessToken()` to create 15-minute Access Token.
  5. Generates UUID Refresh Token with 7-day expiration and saves it in `refresh_tokens` database table.
  6. Returns `AuthResponse` containing both tokens.

---

### 1.2 `POST /api/auth/login`
* **Purpose**: Authenticates credentials and issues JWT tokens.
* **Public/Protected**: Public Endpoint.
* **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
* **Step-by-step Flow**:
  1. `AuthService.login()` queries `UserRepository` by email.
  2. Compares password. If invalid, returns HTTP `401 Unauthorized`.
  3. On success, generates a fresh **Access Token** and **Refresh Token**.
  4. Overwrites existing refresh token in DB for this user.
  5. Returns HTTP `200 OK` with `accessToken`, `refreshToken`, and user role.

---

### 1.3 `POST /api/auth/refresh`
* **Purpose**: Exchanges a valid Refresh Token for a new Access Token when the short-lived access token expires.
* **Public/Protected**: Public Endpoint.
* **Request Body**:
```json
{
  "refreshToken": "4a7b9c1d-8e2f-4a1b-9c8d-7e6f5a4b3c2d"
}
```
* **Step-by-step Flow**:
  1. `AuthService.refreshAccessToken()` queries `RefreshTokenRepository`.
  2. Checks if token exists in DB, is revoked, or is past `expiryDate`.
  3. If expired/revoked: Deletes token from DB and returns HTTP `401 Unauthorized` (`"Please log in again"`).
  4. If valid: Fetches associated `User` and generates a **NEW Access Token**.
  5. Returns HTTP `200 OK` with `newAccessToken`.

---

### 1.4 `POST /api/auth/logout`
* **Purpose**: Logs out user by revoking & deleting their Refresh Token.
* **Public/Protected**: Public Endpoint.
* **Request Body**:
```json
{
  "refreshToken": "4a7b9c1d-8e2f-4a1b-9c8d-7e6f5a4b3c2d"
}
```
* **Step-by-step Flow**:
  1. Finds `RefreshToken` in database.
  2. Marks `revoked = true` and deletes record from `refresh_tokens` table.
  3. Client clears `accessToken` and `refreshToken` from `localStorage`.
  4. Any future attempt to call `/api/auth/refresh` with the logged-out token will fail!

---

### 1.5 `GET /api/auth/validate`
* **Purpose**: Utility endpoint to verify if an Access Token is valid.
* **Header**: `Authorization: Bearer <access_token>`
* **Response**:
```json
{
  "valid": true,
  "email": "user@example.com",
  "role": "ROLE_USER"
}
```

---

## 🛒 2. ORDER SERVICE (`order-service` - Port 8081)

### 2.1 `POST /api/orders` (or `/api/orders/checkout`)
* **Purpose**: Initiates the Distributed Checkout Saga.
* **Public/Protected**: Protected (Requires `Authorization: Bearer <access_token>`).
* **Request Body**:
```json
{
  "customerEmail": "user@example.com",
  "sku": "PROD-NEO-01",
  "quantity": 1,
  "amount": 199.99,
  "paymentMethod": "CREDIT_CARD",
  "simulatePaymentFailure": false
}
```
* **Step-by-step Flow**:
  1. Request passes through **API Gateway (Port 8080)** `AuthenticationFilter`.
  2. Gateway validates JWT signature and injects headers `X-User-Email` & `X-User-Role`.
  3. `OrderController` calls `SagaOrchestrator.executeOrderSaga()`.
  4. **Step 1**: Saves local `Order` entity with status `PENDING`.
  5. **Step 2**: OpenFeign calls `inventory-service:8082` to reserve stock. Status advances to `INVENTORY_RESERVED`.
  6. **Step 3**: OpenFeign calls `payment-service:8083` wrapped in Resilience4j `@CircuitBreaker`.
  7. **Step 4 (Success)**: Status set to `CONFIRMED`. Dispatches `@Async` call to `notification-service:8084`.
  8. **Step 4 (Failure Compensation)**: If payment fails, calls `inventoryClient.releaseStock()` to compensate inventory! Status set to `CANCELLED_PAYMENT_FAILED`.

---

### 2.2 `GET /api/orders/{orderId}`
* **Purpose**: Retrieves order details and audit logs for live visualizer.
* **Public/Protected**: Protected.
* **Response**: Returns `OrderResponse` DTO containing list of `SagaLog` steps.

---

## 📦 3. INVENTORY SERVICE (`inventory-service` - Port 8082)

### 3.1 `GET /api/products`
* **Purpose**: Returns product catalog.
* **Public/Protected**: Public Endpoint (browsable by guests).
* **Redis Caching**: Checked via Redis Cache-Aside (`product:{sku}`). Returns cached JSON in <2ms.

---

### 3.2 `POST /api/inventory/reserve`
* **Purpose**: Reserves stock for an order during Saga Step 2.
* **Public/Protected**: Protected (Inter-service Feign / Protected).
* **Request Body**:
```json
{
  "orderId": "ORD-A1B2C3D4",
  "sku": "PROD-NEO-01",
  "quantity": 1
}
```
* **Step-by-step Flow**:
  1. Acquires **Redis Distributed Lock** `lock:sku:PROD-NEO-01` (`SET NX PX 5000`).
  2. Checks available stock quantity in MySQL.
  3. If sufficient: Deducts stock, invalidates Redis cache `product:PROD-NEO-01`, releases lock, and returns `InventoryResponse(success=true)`.
  4. If insufficient: Releases lock and returns `InventoryResponse(success=false, message="Out of stock")`.

---

### 3.3 `POST /api/inventory/release`
* **Purpose**: **Compensating Transaction**. Releases stock back if payment fails later in the Saga.
* **Request Body**: Same as reserve request.
* **Flow**: Restores stock quantity (+1) in database & Redis cache.

---

## 💳 4. PAYMENT SERVICE (`payment-service` - Port 8083)

### 4.1 `POST /api/payments/process`
* **Purpose**: Processes credit card payment during Saga Step 3.
* **Protected**: Inter-service / Resilience4j Protected.
* **Request Body**:
```json
{
  "orderId": "ORD-A1B2C3D4",
  "amount": 199.99,
  "paymentMethod": "CREDIT_CARD",
  "simulateFailure": false
}
```
* **Flow**:
  1. Checks if `simulateFailure == true`. If true, returns `PaymentResponse(success=false, status="PAYMENT_DECLINED")`.
  2. If Resilience4j failure threshold is exceeded, Circuit Breaker trips to `OPEN` and executes fallback `paymentCircuitBreakerFallback()`.
  3. If successful, creates `PaymentTransaction` record and returns `PaymentResponse(success=true, transactionId="TX-99812")`.

---

## 🔔 5. NOTIFICATION SERVICE (`notification-service` - Port 8084)

### 5.1 `POST /api/notifications/send`
* **Purpose**: Sends asynchronous order confirmation email / SMS alerts.
* **Flow**: Invoked via `@Async` non-blocking thread from `SagaOrchestrator` after order confirmation.

---

# 🧠 REVISION CHEAT SHEET

```
┌─────────────────────────┬───────────────────────────────────────────────────────────┐
│ CONCEPT                 │ ONE-LINE REVISION SUMMARY                                 │
├─────────────────────────┼───────────────────────────────────────────────────────────┤
│ Access Token            │ Short-lived (15m) JWT sent in `Authorization: Bearer` hdr.│
│ Refresh Token           │ Long-lived (7d) token stored in DB used to get new Access.│
│ Logout Flow             │ Deletes/Revokes RefreshToken in DB so it cannot be reused.│
│ Gateway Auth Filter     │ Global filter validating JWT signature without database hit│
│ Eureka Server           │ Service registry on 8761 where services register IP/Ports.│
│ API Gateway             │ Entry point on 8080 routing requests with `lb://`.        │
│ Saga Pattern            │ Manages multi-service transactions via compensating steps.│
│ Saga Orchestrator       │ Central controller directing transaction state & rollbacks│
│ Circuit Breaker         │ Prevents cascading failures (CLOSED -> OPEN -> HALF_OPEN).│
│ Redis Cache-Aside       │ Read Redis first; fallback to DB & write to Redis with TTL│
│ Redis Distributed Lock  │ `SET lock:sku NX PX` prevents concurrent overselling.     │
└─────────────────────────┴───────────────────────────────────────────────────────────┘
```

---
*Spring Boot Microservices E-Commerce Architecture with Dual JWT Security.*
