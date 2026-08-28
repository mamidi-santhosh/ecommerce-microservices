# 📱 MOBILE STUDY NOTES & E-COMMERCE MICROSERVICES ARCHITECTURE
> **7-Day Mastery Guide & Real-Time Production Architecture**
> 
> *Designed with compact ASCII diagrams, high-contrast callouts, Redis integration, Apache Kafka Event-Driven Messaging, JWT Security, complete step-by-step endpoint breakdowns, and under-the-hood execution flows.*

---

## 🎯 7-DAY MASTERY ROADMAP OVERVIEW

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
  ├─────────────────────────────────────────────────────────┤
  │ DAY 7: Apache Kafka Event-Driven Messaging Architecture │
  └─────────────────────────────────────────────────────────┘
```

---

# 🏗️ SYSTEM ARCHITECTURE WITH AUTH, REDIS & KAFKA

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
                          │ Publish Event    ▼
                          ▼           ┌──────────────┐
                   ┌──────────────┐   │ 🟥 REDIS     │
                   │ 🐘 APACHE    │   │ (Port 6379)  │
                   │ KAFKA (9092) │   │ • Cache      │
                   │ order-events │   │ • Lock (SKU) │
                   └──────┬───────┘   └──────────────┘
                          │
                          │ Subscribe @KafkaListener
                          ▼
                   ┌──────────────┐
                   │ 🔔 NOTIFY    │
                   │ SERVICE      │
                   │ (Port 8084)  │
                   └──────────────┘
```

### Complete System Services & Port Reference Table

| Service | Port | Key Role / Responsibility |
| :--- | :--- | :--- |
| `eureka-server` | `8761` | Central Service Registry & Heartbeat Monitor |
| `api-gateway` | `8080` | Entry Point, Route Rules, Global JWT Filter, CORS |
| `auth-service` | `8085` | User Registration, Login, Access & Refresh Token Management |
| `order-service` | `8081` | Saga Master, Feign Dispatcher, Kafka Producer, Resilience4j |
| `inventory-service`| `8082` | Stock Reservation, Redis Lock, Release Compensation |
| `payment-service` | `8083` | Payment Processing & Failure Simulation |
| `notification-service`| `8084` | Kafka Event Consumer, Asynchronous Email/SMS Dispatcher |
| `kafka` / `zookeeper`| `9092` / `2181` | Distributed Event Streaming Bus (`order-events-topic`) |
| `redis` | `6379` | Cache-Aside Product Data & Distributed Locking |
| `frontend-react` | `3000` | Real-time UI, Auth Modal & Saga Execution Visualizer |

---

# 🐘 DAY 7: APACHE KAFKA EVENT-DRIVEN MESSAGING ARCHITECTURE

### 💡 Core Concept: Why Add Apache Kafka?

> 📱 **Handwritten Note**: 
> 1. **Decoupling**: Without Kafka, `order-service` must call `notification-service` via HTTP. If Notification Service crashes or runs slow, Order checkout stalls! With Kafka, `order-service` publishes an event and instantly finishes. `notification-service` consumes it independently.
> 2. **High Throughput & Replayability**: Kafka handles millions of events per second and stores events on disk so new consumers can replay history.
> 3. **Consumer Groups**: Multiple notification worker instances in `notification-group` balance topic partition consumption automatically!

---

## 🔄 KAFKA EVENT PUBLISH & CONSUME SEQUENCE FLOW

```
 ┌────────────────┐                  ┌────────────────┐                  ┌────────────────┐
 │ Order Service  │                  │  Apache Kafka  │                  │  Notification  │
 │ (Kafka Producer)│                 │  Broker (9092) │                  │ (Kafka Consumer)│
 └───────┬────────┘                  └───────┬────────┘                  └───────┬────────┘
         │                                   │                                   │
         │ 1. Order CONFIRMED in Saga        │                                   │
         │                                   │                                   │
         │ 2. KafkaTemplate.send(...) ──────▶│                                   │
         │    Topic: "order-events-topic"    │                                   │
         │    Key: "ORD-8F2A1C90"            │                                   │
         │    Payload: OrderEvent JSON       │                                   │
         │                                   │ 3. Appends event to partition     │
         │                                   │                                   │
         │                                   │ 4. @KafkaListener poll ──────────▶│
         │                                   │                                   │
         │                                   │                                   │ 5. Processes OrderEvent
         │                                   │                                   │ 6. Logs Email to DB
```

---

## 🧑‍💻 KAFKA CODE IMPLEMENTATION BREAKDOWN

### 1. Kafka Event DTO (`OrderEvent.java`)
* **Order Service**: [`OrderEvent.java`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/order-service/src/main/java/com/ecommerce/order/event/OrderEvent.java)
* **Notification Service**: [`OrderEvent.java`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/notification-service/src/main/java/com/ecommerce/notification/event/OrderEvent.java)

```java
public class OrderEvent implements Serializable {
    private String orderId;
    private String customerEmail;
    private String sku;
    private int quantity;
    private BigDecimal amount;
    private String status; // CONFIRMED, CANCELLED_*
    private String message;
    private LocalDateTime timestamp;
}
```

---

### 2. Kafka Producer Configuration & Service (`order-service`)
* **Producer Config**: [`KafkaProducerConfig.java`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/order-service/src/main/java/com/ecommerce/order/config/KafkaProducerConfig.java)
* **Producer Service**: [`OrderEventProducer.java`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/order-service/src/main/java/com/ecommerce/order/event/OrderEventProducer.java)

```java
@Configuration
public class KafkaProducerConfig {

    @Bean
    public NewTopic orderEventsTopic() {
        return TopicBuilder.name("order-events-topic")
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public KafkaTemplate<String, OrderEvent> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }
}
```

```java
@Service
public class OrderEventProducer {
    private static final String TOPIC = "order-events-topic";
    private final KafkaTemplate<String, OrderEvent> kafkaTemplate;

    public void sendOrderEvent(OrderEvent event) {
        kafkaTemplate.send(TOPIC, event.getOrderId(), event);
        System.out.println(">>> [KAFKA PRODUCER] Published OrderEvent: " + event.getOrderId());
    }
}
```

---

### 3. Kafka Consumer Configuration & Listener (`notification-service`)
* **Consumer Config**: [`KafkaConsumerConfig.java`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/notification-service/src/main/java/com/ecommerce/notification/config/KafkaConsumerConfig.java)
* **Consumer Service**: [`OrderEventConsumer.java`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/notification-service/src/main/java/com/ecommerce/notification/event/OrderEventConsumer.java)

```java
@Service
public class OrderEventConsumer {

    private final NotificationService notificationService;

    @KafkaListener(topics = "order-events-topic", groupId = "notification-group")
    public void consumeOrderEvent(OrderEvent event) {
        System.out.println(">>> [KAFKA CONSUMER] Received Event for Order: " + event.getOrderId());

        NotificationRequest request = new NotificationRequest(
                event.getOrderId(), event.getCustomerEmail(),
                "Kafka Event: Order " + event.getOrderId() + " is " + event.getStatus(), "EMAIL"
        );
        notificationService.sendNotificationAsync(request);
    }
}
```

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
| **Kafka Producer** | [`OrderEventProducer.java`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/order-service/src/main/java/com/ecommerce/order/event/OrderEventProducer.java) | Publishes `OrderEvent` JSON payload to Kafka `order-events-topic`. |
| **Kafka Consumer** | [`OrderEventConsumer.java`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/notification-service/src/main/java/com/ecommerce/notification/event/OrderEventConsumer.java) | Subscribes to `order-events-topic` and logs notifications to DB asynchronously. |
| **Order Domain Entity** | [`Order.java`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/order-service/src/main/java/com/ecommerce/order/model/Order.java) | Entity storing order state (`PENDING`, `INVENTORY_RESERVED`, `CONFIRMED`, `CANCELLED_*`). |
| **Saga Audit Log** | [`SagaLog.java`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/order-service/src/main/java/com/ecommerce/order/model/SagaLog.java) | Audit log record persisted for live visualizer tracking. |
| **Inventory Feign Client** | [`InventoryClient.java`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/order-service/src/main/java/com/ecommerce/order/client/InventoryClient.java#L10-L17) | OpenFeign interface for stock reservation (`/reserve`) & stock release (`/release`). |
| **Payment Feign Client** | [`PaymentClient.java`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/order-service/src/main/java/com/ecommerce/order/client/PaymentClient.java#L10-L14) | OpenFeign interface for charging payments (`/process`). |

---

# 📚 STEP-BY-STEP COMPLETE ENDPOINT DOCUMENTATION

Below is the complete, detailed step-by-step breakdown of **EVERY SINGLE ENDPOINT** across all 6 microservices in this project.

---

## 🔑 1. AUTHENTICATION SERVICE (`auth-service` - Port 8085)
* **`POST /api/auth/register`**: Registers a new user account.
* **`POST /api/auth/login`**: Authenticates credentials and issues JWT tokens.
* **`POST /api/auth/refresh`**: Exchanges a valid Refresh Token for a new Access Token.
* **`POST /api/auth/logout`**: Revokes & deletes Refresh Token from database.
* **`GET /api/auth/validate`**: Utility endpoint to verify if an Access Token is valid.

---

## 🛒 2. ORDER SERVICE (`order-service` - Port 8081)
* **`POST /api/orders`**: Initiates Distributed Saga & publishes `OrderEvent` to Kafka topic `order-events-topic`.
* **`GET /api/orders/{orderId}`**: Retrieves order details and audit logs for visualizer.

---

## 📦 3. INVENTORY SERVICE (`inventory-service` - Port 8082)
* **`GET /api/products`**: Returns product catalog (Redis Cache-Aside).
* **`POST /api/inventory/reserve`**: Reserves stock using Redis Distributed Lock `lock:sku`.
* **`POST /api/inventory/release`**: Compensating Transaction (Restores stock if payment fails).

---

## 💳 4. PAYMENT SERVICE (`payment-service` - Port 8083)
* **`POST /api/payments/process`**: Processes credit card payment (Resilience4j `@CircuitBreaker` protected).

---

## 🔔 5. NOTIFICATION SERVICE (`notification-service` - Port 8084)
* **`POST /api/notifications/send`**: Direct REST notification endpoint.
* **Kafka Consumer (`@KafkaListener`)**: Subscribes to `order-events-topic` in group `notification-group` to log email alerts asynchronously.

---

# 🧠 REVISION CHEAT SHEET

```
┌─────────────────────────┬───────────────────────────────────────────────────────────┐
│ CONCEPT                 │ ONE-LINE REVISION SUMMARY                                 │
├─────────────────────────┼───────────────────────────────────────────────────────────┤
│ Apache Kafka            │ Distributed event bus (`order-events-topic`) for async events│
│ Kafka Producer          │ `KafkaTemplate` sending JSON payload with Order ID key.   │
│ Kafka Consumer          │ `@KafkaListener` in group `notification-group` consuming  │
│ Saga Orchestrator       │ Central controller directing transaction steps & rollbacks │
│ Redis Distributed Lock  │ `SET lock:sku NX PX` prevents concurrent overselling.     │
└─────────────────────────┴───────────────────────────────────────────────────────────┘
```

---
*Complete 7-Day Mastery Notes with Kafka Event-Driven Messaging, Redis Caching, Dual JWT Security & Saga Orchestration.*
