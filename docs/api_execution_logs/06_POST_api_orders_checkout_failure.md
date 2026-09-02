# 📄 API EXECUTION LOG: `POST /api/orders` (SAGA FAILURE & COMPENSATION)

---

## 1. 🌐 API METADATA & REQUEST PAYLOAD

* **HTTP Method**: `POST`
* **Full URL**: `http://localhost:8080/api/orders`
* **Target Microservice**: `order-service` (Port `8081`) via `api-gateway` (Port `8080`)
* **Public / Protected**: Protected Endpoint (Requires Valid Bearer Token)
* **Headers**:
  ```http
  Content-Type: application/json
  Authorization: Bearer {{accessToken}}
  ```
* **Request Body JSON** (Note `simulatePaymentFailure: true`):
  ```json
  {
    "customerEmail": "user@example.com",
    "sku": "PROD-NEO-01",
    "quantity": 1,
    "amount": 1499.99,
    "paymentMethod": "CREDIT_CARD",
    "simulatePaymentFailure": true
  }
  ```

---

## 2. 🗺️ NETWORK REQUEST TRAVERSAL & MICROSERVICE FLOW

```
[React App / Postman]
       │
       │ HTTP POST /api/orders (simulatePaymentFailure: true)
       ▼
[API Gateway :8080]
       │
       ├─▶ AuthenticationFilter (Validates JWT signature & expiry locally)
       ├─▶ Eureka Resolver (Resolves lb://order-service ➔ http://localhost:8081)
       ▼
[Order Service :8081]
       │
       ├─▶ OrderController.placeOrder()
       ├─▶ SagaOrchestrator.executeOrderSaga() [@Transactional]
       │      │
       │      ├─▶ STEP 1: Save local Order (ORD-77A1C290) status PENDING
       │      │
       │      ├─▶ STEP 2: Feign Call ➔ InventoryService.reserveStock() [Port 8082]
       │      │             ├─▶ Deduct Stock in MySQL: 49 ➔ 48
       │      │           Order Status ➔ INVENTORY_RESERVED
       │      │
       │      ├─▶ STEP 3: Feign Call ➔ PaymentService.processPayment() [Port 8083]
       │      │             └─▶ ❌ Payment Declined! (returns paymentResponse.isSuccess() = false)
       │      │
       │      └─▶ STEP 4: SAGA COMPENSATING TRANSACTION DISPATCHED!
       │                    ├─▶ Feign Call ➔ InventoryService.releaseStock() [POST /api/inventory/release]
       │                    │     └─▶ Restores Stock in MySQL: 48 ➔ 49 🔄
       │                    ├─▶ Save SagaLog [COMPENSATE_INVENTORY] -> COMPENSATED
       │                    └─▶ Order Status ➔ CANCELLED_PAYMENT_FAILED
       ▼
[HTTP 400 Bad Request Response with Cancelled Order & Compensation Saga Logs]
```

---

## 3. 🧑‍💻 CODE FILE & LINE TRAVERSAL TRACE

1. **Saga Step 2: OpenFeign Stock Reservation**:
   [`SagaOrchestrator.java:L69-L92`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/order-service/src/main/java/com/ecommerce/order/saga/SagaOrchestrator.java#L69-L92) (Stock goes from 49 ➔ 48).

2. **Saga Step 3: Payment Declined Detection**:
   [`SagaOrchestrator.java:L98-L100`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/order-service/src/main/java/com/ecommerce/order/saga/SagaOrchestrator.java#L98-L100)
   * `paymentResponse.isSuccess()` evaluates to `false`.

3. **Saga Step 4: Compensating Transaction Trigger**:
   [`SagaOrchestrator.java:L101-L108`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/order-service/src/main/java/com/ecommerce/order/saga/SagaOrchestrator.java#L101-L108)
   * Invokes `inventoryClient.releaseStock(new ReservationRequest(orderId, sku, quantity))`
   * REST call hits [`InventoryController.java:L30-L34`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/inventory-service/src/main/java/com/ecommerce/inventory/controller/InventoryController.java#L30-L34).
   * Restores MySQL stock (`stock = stock + 1`).

---

## 4. 🗄️ DATABASE STATE (MySQL `ecommerce_db`) BEFORE VS AFTER

### 🔹 Database State BEFORE API Call:
* **Table `products`**:
  ```sql
  +----+--------------+----------------------+--------+-------+
  | id | sku          | name                 | price  | stock |
  +----+--------------+----------------------+--------+-------+
  |  1 | PROD-NEO-01  | Cyberpunk Neo Laptop | 1499.99|    49 |
  +----+--------------+----------------------+--------+-------+
  ```

---

### 🔹 Executed SQL Statements (Hibernate ORM):
```sql
-- 1. Create Order PENDING
INSERT INTO orders (order_id, customer_email, sku, quantity, total_amount, status, created_at)
VALUES ('ORD-77A1C290', 'user@example.com', 'PROD-NEO-01', 1, 1499.99, 'PENDING', NOW());

-- 2. Reserve Stock in Inventory
UPDATE products SET stock = stock - 1 WHERE sku = 'PROD-NEO-01'; -- stock becomes 48

-- 3. Update Order Status -> INVENTORY_RESERVED
UPDATE orders SET status = 'INVENTORY_RESERVED' WHERE order_id = 'ORD-77A1C290';

-- 4. Payment Fails! Execute SAGA COMPENSATING TRANSACTION:
UPDATE products SET stock = stock + 1 WHERE sku = 'PROD-NEO-01'; -- stock RESTORED to 49 🔄

-- 5. Set Final Order Status -> CANCELLED_PAYMENT_FAILED
UPDATE orders SET status = 'CANCELLED_PAYMENT_FAILED', failure_reason = 'Payment declined!' WHERE order_id = 'ORD-77A1C290';
```

---

### 🔹 Database State AFTER API Call:

* **Table `orders`**:
  ```sql
  +----+--------------+------------------+-------------+----------+--------------+--------------------------+---------------------+
  | id | order_id     | customer_email   | sku         | quantity | total_amount | status                   | created_at          |
  +----+--------------+------------------+-------------+----------+--------------+--------------------------+---------------------+
  |  2 | ORD-77A1C290 | user@example.com | PROD-NEO-01 |        1 |      1499.99 | CANCELLED_PAYMENT_FAILED | 2026-09-02 11:59:00 |
  +----+--------------+------------------+-------------+----------+--------------+--------------------------+---------------------+
  ```

* **Table `products` (Stock restored back to 49)**:
  ```sql
  +----+--------------+----------------------+--------+-------+
  | id | sku          | name                 | price  | stock |
  +----+--------------+----------------------+--------+-------+
  |  1 | PROD-NEO-01  | Cyberpunk Neo Laptop | 1499.99|    49 |
  +----+--------------+----------------------+--------+-------+
  ```

* **Table `saga_logs`**:
  ```sql
  +----+--------------+----------------------+-------------+----------------------------------------------+
  | id | order_id     | step_name            | status      | details                                      |
  +----+--------------+----------------------+-------------+----------------------------------------------+
  |  8 | ORD-77A1C290 | CREATE_ORDER         | COMPLETED   | Saved local order with status PENDING        |
  |  9 | ORD-77A1C290 | RESERVE_INVENTORY    | COMPLETED   | Stock reserved! Remaining stock: 48          |
  | 10 | ORD-77A1C290 | PROCESS_PAYMENT      | FAILED      | Payment failed: Payment declined!            |
  | 11 | ORD-77A1C290 | COMPENSATE_INVENTORY | STARTED     | Triggering Saga Compensation: Releasing stock|
  | 12 | ORD-77A1C290 | COMPENSATE_INVENTORY | COMPENSATED | Stock compensation complete. Restocked (+1). |
  +----+--------------+----------------------+-------------+----------------------------------------------+
  ```

---

## 5. ⚡ REDIS & KAFKA BEHAVIOR

* **Redis Cache Eviction**: Key `catalog:products` deleted to ensure stock count 49 is reflected.
* **Kafka Event Bus**: Unaffected (Events are NOT published for cancelled orders).

---

## 6. 📤 RESPONSE PAYLOAD & HTTP STATUS

* **HTTP Status Code**: `400 Bad Request`
* **Response Body JSON**:
  ```json
  {
    "orderId": "ORD-77A1C290",
    "customerEmail": "user@example.com",
    "sku": "PROD-NEO-01",
    "quantity": 1,
    "totalAmount": 1499.99,
    "status": "CANCELLED_PAYMENT_FAILED",
    "failureReason": "Payment declined!",
    "createdAt": "2026-09-02T11:59:00",
    "sagaLogs": [
      { "stepName": "CREATE_ORDER", "status": "COMPLETED", "details": "Saved local order with status PENDING" },
      { "stepName": "RESERVE_INVENTORY", "status": "COMPLETED", "details": "Stock reserved! Remaining stock: 48" },
      { "stepName": "PROCESS_PAYMENT", "status": "FAILED", "details": "Payment failed: Payment declined!" },
      { "stepName": "COMPENSATE_INVENTORY", "status": "COMPENSATED", "details": "Stock compensation complete. Restocked (+1)." }
    ]
  }
  ```
