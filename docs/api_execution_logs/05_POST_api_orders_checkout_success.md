# 📄 API EXECUTION LOG: `POST /api/orders` (SAGA CHECKOUT SUCCESS)

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
* **Request Body JSON**:
  ```json
  {
    "customerEmail": "user@example.com",
    "sku": "PROD-NEO-01",
    "quantity": 1,
    "amount": 1499.99,
    "paymentMethod": "CREDIT_CARD",
    "simulatePaymentFailure": false
  }
  ```

---

## 2. 🗺️ NETWORK REQUEST TRAVERSAL & MICROSERVICE FLOW

```
[React App / Postman]
       │
       │ HTTP POST /api/orders (Authorization: Bearer <AccessToken>)
       ▼
[API Gateway :8080]
       │
       ├─▶ AuthenticationFilter (Validates JWT signature & expiry locally)
       ├─▶ Mutates Request: Injects Headers [X-User-Email: user@example.com, X-User-Role: ROLE_USER]
       ├─▶ Eureka Resolver (Resolves lb://order-service ➔ http://localhost:8081)
       ▼
[Order Service :8081]
       │
       ├─▶ OrderController.placeOrder()
       ├─▶ SagaOrchestrator.executeOrderSaga() [@Transactional]
       │      │
       │      ├─▶ STEP 1: Save local Order (ORD-8F2A1C90) status PENDING ➔ Save SagaLog [CREATE_ORDER]
       │      │
       │      ├─▶ STEP 2: Feign Call ➔ InventoryService.reserveStock() [Port 8082]
       │      │             ├─▶ Acquire Redis Lock: lock:sku:PROD-NEO-01 (SET NX PX 5000)
       │      │             ├─▶ Deduct Stock in MySQL: 50 ➔ 49
       │      │             ├─▶ Evict Redis Cache: DEL catalog:products
       │      │             └─▶ Release Redis Lock
       │      │           Order Status ➔ INVENTORY_RESERVED
       │      │
       │      ├─▶ STEP 3: Feign Call + Resilience4j @CircuitBreaker ➔ PaymentService.processPayment() [Port 8083]
       │      │             └─▶ Payment Processed ➔ Transaction TX-99182 Created!
       │      │
       │      ├─▶ STEP 4: Order Status ➔ CONFIRMED ➔ Save SagaLog [CONFIRM_ORDER]
       │      │
       │      └─▶ STEP 5: Kafka Event Dispatch ➔ Publish OrderEvent JSON ➔ Topic: order-events-topic
       ▼                                                                         │
[HTTP 200 OK Response with Full Saga Logs]                                       ▼
                                                                  [Notification Service :8084]
                                                                     @KafkaListener (group: notification-group)
                                                                     Consumes event ➔ Logs email to MySQL DB
```

---

## 3. 🧑‍💻 CODE FILE & LINE TRAVERSAL TRACE

1. **Gateway Security & Header Forwarding**:
   [`AuthenticationFilter.java:L59-L72`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/api-gateway/src/main/java/com/ecommerce/gateway/filter/AuthenticationFilter.java#L59-L72)

2. **Order Controller Delegation**:
   [`OrderController.java:L35-L41`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/order-service/src/main/java/com/ecommerce/order/controller/OrderController.java#L35-L41)

3. **Saga Step 1: Create Order (`PENDING`)**:
   [`SagaOrchestrator.java:L55-L67`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/order-service/src/main/java/com/ecommerce/order/saga/SagaOrchestrator.java#L55-L67)

4. **Saga Step 2: OpenFeign Stock Reservation & Redis Lock**:
   [`SagaOrchestrator.java:L69-L92`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/order-service/src/main/java/com/ecommerce/order/saga/SagaOrchestrator.java#L69-L92) ➔ [`InventoryService.java:L52-L78`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/inventory-service/src/main/java/com/ecommerce/inventory/service/InventoryService.java#L52-L78)

5. **Saga Step 3: Resilience4j Circuit Breaker Payment**:
   [`SagaOrchestrator.java:L94-L96 & L137-L145`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/order-service/src/main/java/com/ecommerce/order/saga/SagaOrchestrator.java#L94-L96)

6. **Saga Step 4 & 5: Confirmation & Kafka Dispatch**:
   [`SagaOrchestrator.java:L120-L132`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/order-service/src/main/java/com/ecommerce/order/saga/SagaOrchestrator.java#L120-L132) ➔ [`OrderEventConsumer.java:L18-L29`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/notification-service/src/main/java/com/ecommerce/notification/event/OrderEventConsumer.java#L18-L29)

---

## 4. 🗄️ DATABASE STATE (MySQL `ecommerce_db`) BEFORE VS AFTER

### 🔹 Database State BEFORE API Call:

* **Table `orders`**: Empty set (0 rows)
* **Table `saga_logs`**: Empty set (0 rows)
* **Table `products`**:
  ```sql
  +----+--------------+----------------------+--------+-------+
  | id | sku          | name                 | price  | stock |
  +----+--------------+----------------------+--------+-------+
  |  1 | PROD-NEO-01  | Cyberpunk Neo Laptop | 1499.99|    50 |
  +----+--------------+----------------------+--------+-------+
  ```
* **Table `notification_logs`**: Empty set (0 rows)

---

### 🔹 Executed SQL Statements (Hibernate ORM):
```sql
-- 1. Insert Order record in order-service
INSERT INTO orders (order_id, customer_email, sku, quantity, total_amount, status, created_at)
VALUES ('ORD-8F2A1C90', 'user@example.com', 'PROD-NEO-01', 1, 1499.99, 'PENDING', NOW());

-- 2. Insert Saga Log [CREATE_ORDER]
INSERT INTO saga_logs (order_id, step_name, status, details, timestamp)
VALUES ('ORD-8F2A1C90', 'CREATE_ORDER', 'COMPLETED', 'Saved local order with status PENDING', NOW());

-- 3. Deduct Stock in inventory-service
UPDATE products SET stock = stock - 1 WHERE sku = 'PROD-NEO-01';

-- 4. Update Order status in order-service
UPDATE orders SET status = 'INVENTORY_RESERVED' WHERE order_id = 'ORD-8F2A1C90';

-- 5. Insert Payment record in payment-service
INSERT INTO payments (transaction_id, order_id, amount, payment_method, status, created_at)
VALUES ('TX-99182', 'ORD-8F2A1C90', 1499.99, 'CREDIT_CARD', 'SUCCESS', NOW());

-- 6. Update Order status to CONFIRMED
UPDATE orders SET status = 'CONFIRMED' WHERE order_id = 'ORD-8F2A1C90';

-- 7. Insert Notification record in notification-service (via Kafka Listener)
INSERT INTO notification_logs (order_id, recipient_email, message, channel, timestamp)
VALUES ('ORD-8F2A1C90', 'user@example.com', 'Event-Driven Kafka Notification: Your order ORD-8F2A1C90 is CONFIRMED', 'EMAIL', NOW());
```

---

### 🔹 Database State AFTER API Call:

* **Table `orders`**:
  ```sql
  +----+--------------+------------------+-------------+----------+--------------+-----------+---------------------+
  | id | order_id     | customer_email   | sku         | quantity | total_amount | status    | created_at          |
  +----+--------------+------------------+-------------+----------+--------------+-----------+---------------------+
  |  1 | ORD-8F2A1C90 | user@example.com | PROD-NEO-01 |        1 |      1499.99 | CONFIRMED | 2026-09-02 11:58:50 |
  +----+--------------+------------------+-------------+----------+--------------+-----------+---------------------+
  ```

* **Table `products` (Stock deducted from 50 ➔ 49)**:
  ```sql
  +----+--------------+----------------------+--------+-------+
  | id | sku          | name                 | price  | stock |
  +----+--------------+----------------------+--------+-------+
  |  1 | PROD-NEO-01  | Cyberpunk Neo Laptop | 1499.99|    49 |
  +----+--------------+----------------------+--------+-------+
  ```

* **Table `saga_logs`**:
  ```sql
  +----+--------------+-----------------------+------------+------------------------------------------+
  | id | order_id     | step_name             | status     | details                                  |
  +----+--------------+-----------------------+------------+------------------------------------------+
  |  1 | ORD-8F2A1C90 | CREATE_ORDER          | COMPLETED  | Saved local order with status PENDING    |
  |  2 | ORD-8F2A1C90 | RESERVE_INVENTORY     | STARTED    | Reserving stock for SKU: PROD-NEO-01     |
  |  3 | ORD-8F2A1C90 | RESERVE_INVENTORY     | COMPLETED  | Stock reserved! Remaining stock: 49      |
  |  4 | ORD-8F2A1C90 | PROCESS_PAYMENT       | STARTED    | Charging credit card via Payment Service |
  |  5 | ORD-8F2A1C90 | PROCESS_PAYMENT       | COMPLETED  | Payment charged! Tx ID: TX-99182         |
  |  6 | ORD-8F2A1C90 | CONFIRM_ORDER         | COMPLETED  | Order CONFIRMED!                         |
  |  7 | ORD-8F2A1C90 | KAFKA_EVENT_PUBLISHED | DISPATCHED | Published event to topic order-events    |
  +----+--------------+-----------------------+------------+------------------------------------------+
  ```

---

## 5. ⚡ REDIS & KAFKA BEHAVIOR

* **Redis Distributed Lock**:
  * Key `lock:sku:PROD-NEO-01` set to `"LOCKED"` during reservation and deleted in `finally` block.
* **Redis Cache Eviction**:
  * Key `catalog:products` deleted to ensure fresh stock counts are queried on next product read.
* **Kafka Event Bus**:
  * Topic: `order-events-topic`
  * Partition Key: `"ORD-8F2A1C90"`
  * Payload JSON: `{"orderId":"ORD-8F2A1C90","customerEmail":"user@example.com","sku":"PROD-NEO-01","quantity":1,"amount":1499.99,"status":"CONFIRMED", ...}`

---

## 6. 📤 RESPONSE PAYLOAD & HTTP STATUS

* **HTTP Status Code**: `200 OK`
* **Response Body JSON**:
  ```json
  {
    "orderId": "ORD-8F2A1C90",
    "customerEmail": "user@example.com",
    "sku": "PROD-NEO-01",
    "quantity": 1,
    "totalAmount": 1499.99,
    "status": "CONFIRMED",
    "failureReason": null,
    "createdAt": "2026-09-02T11:58:50",
    "sagaLogs": [
      { "stepName": "CREATE_ORDER", "status": "COMPLETED", "details": "Saved local order with status PENDING" },
      { "stepName": "RESERVE_INVENTORY", "status": "COMPLETED", "details": "Stock reserved! Remaining stock: 49" },
      { "stepName": "PROCESS_PAYMENT", "status": "COMPLETED", "details": "Payment charged! Tx ID: TX-99182" },
      { "stepName": "CONFIRM_ORDER", "status": "COMPLETED", "details": "Order CONFIRMED!" },
      { "stepName": "KAFKA_EVENT_PUBLISHED", "status": "DISPATCHED", "details": "Published event to topic order-events" }
    ]
  }
  ```
