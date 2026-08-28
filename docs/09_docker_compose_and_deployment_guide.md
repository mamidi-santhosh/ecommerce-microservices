# 📘 LESSON 9: DOCKER COMPOSE & DEPLOYMENT GUIDE

> **Goal**: Master Docker Compose, understand port mappings (`"HOST_PORT:CONTAINER_PORT"`), and follow step-by-step instructions to launch the entire E-Commerce Microservices stack.

---

## 🚪 THE PORT MAPPING EXPLANATION: WHAT DOES `"3306:3306"` MEAN?

In Docker, port mappings follow this exact syntax:
```yaml
ports:
  - "HOST_PORT : CONTAINER_PORT"
```

```
       📱 YOUR COMPUTER (HOST OS)                    🐳 DOCKER CONTAINER
  ┌─────────────────────────────────┐            ┌─────────────────────────┐
  │ Local MySQL Workbench / Apps    │            │ Isolated Linux OS       │
  │ Connects to:                    │            │ MySQL Process Listening │
  │ localhost:3306                  │            │ Inside at Port 3306     │
  └────────────────┬────────────────┘            └────────────▲────────────┘
                   │                                          │
                   └───────────▶ [ PORT FORWARDING ] ─────────┘
                                   3306 ──▶ 3306
```

### 🎈 ELI10 Analogy: The Building Extension Phone
* Imagine a Docker Container is a **private office room** inside a skyscraper. Inside that office room, the worker's desk extension phone number is **`3306` (Container Port)**.
* The skyscraper front desk has a public phone number **`3306` (Host Port)**.
* When someone from the outside world calls the front desk at `3306`, the building switchboard routes the call directly to internal desk extension `3306` inside the room!

### 💡 What if you change it to `"3307:3306"`?
* **`3307` (Host Port)**: You connect your local laptop tools to `localhost:3307`.
* **`3306` (Container Port)**: MySQL inside the container continues to listen on `3306`.
* **Why do this?**: If you ALREADY have a MySQL installed on your laptop using port `3306`, mapping `"3307:3306"` prevents a **Port Conflict Error**!

---

## 📄 LINE-BY-LINE DOCKER COMPOSE BREAKDOWN

```yaml
version: '3.8' # Docker Compose file format version

services:
  # -------------------------------------------------------------
  # 1. MYSQL DATABASE CONTAINER
  # -------------------------------------------------------------
  mysql:
    image: mysql:8.0                       # Downloads official MySQL 8.0 image from Docker Hub
    container_name: ecommerce-mysql        # Custom container name shown in `docker ps`
    ports:
      - "3306:3306"                        # Maps Host Port 3306 -> Container Port 3306
    environment:
      MYSQL_ROOT_PASSWORD: root            # Sets MySQL root password
      MYSQL_DATABASE: ecommerce_db         # Automatically creates database schema on startup
    volumes:
      - mysql_data:/var/lib/mysql          # Persists database data on disk so data isn't lost on restart
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"] # Verifies database is ready to accept connections

  # -------------------------------------------------------------
  # 2. REDIS IN-MEMORY CACHE & DISTRIBUTED LOCK CONTAINER
  # -------------------------------------------------------------
  redis:
    image: redis:7.0-alpine                # Lightweight Redis image based on Alpine Linux
    container_name: ecommerce-redis
    ports:
      - "6379:6379"                        # Maps Host Port 6379 -> Container Port 6379

  # -------------------------------------------------------------
  # 3. APACHE ZOOKEEPER (KAFKA COORDINATOR)
  # -------------------------------------------------------------
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0 # Manages Kafka broker metadata and election
    container_name: ecommerce-zookeeper
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    ports:
      - "2181:2181"

  # -------------------------------------------------------------
  # 4. APACHE KAFKA EVENT STREAMING BROKER
  # -------------------------------------------------------------
  kafka:
    image: confluentinc/cp-kafka:7.5.0     # Official Confluent Kafka image
    container_name: ecommerce-kafka
    depends_on:
      - zookeeper                          # Waits for Zookeeper to start first
    ports:
      - "9092:9092"                        # Maps Host Port 9092 -> Container Port 9092
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1

volumes:
  mysql_data:                             # Named volume declaration for MySQL data persistence
```

---

## 🚀 STEP-BY-STEP INSTRUCTIONS TO BRING UP THE PROJECT

### Step 1: Start Infrastructure Containers (MySQL, Redis, Zookeeper, Kafka)
Open your terminal in the project root directory and run:
```bash
docker-compose up -d
```
* The `-d` flag runs the containers in **detached mode** (in the background).
* Verify running containers with:
```bash
docker ps
```

---

### Step 2: Build All Spring Boot Java Microservices
Clean and compile all Maven modules into executable `.jar` files:
```bash
mvn clean package -DskipTests
```
* Confirms `BUILD SUCCESS` across all 8 reactor modules.

---

### Step 3: Launch Microservices in Required Sequence

> ⚠️ **IMPORTANT**: Launch microservices in this exact order so dependent services can register with Eureka!

1. **Launch Eureka Server (Port 8761)**:
   ```bash
   java -jar eureka-server/target/eureka-server-1.0.0.jar
   ```
   * *Verify by opening `http://localhost:8761` in your browser.*

2. **Launch API Gateway (Port 8080)**:
   ```bash
   java -jar api-gateway/target/api-gateway-1.0.0.jar
   ```

3. **Launch Auth Service (Port 8085)**:
   ```bash
   java -jar auth-service/target/auth-service-1.0.0.jar
   ```

4. **Launch Inventory Service (Port 8082)**:
   ```bash
   java -jar inventory-service/target/inventory-service-1.0.0.jar
   ```

5. **Launch Payment Service (Port 8083)**:
   ```bash
   java -jar payment-service/target/payment-service-1.0.0.jar
   ```

6. **Launch Notification Service (Port 8084)**:
   ```bash
   java -jar notification-service/target/notification-service-1.0.0.jar
   ```

7. **Launch Order Service & Saga Orchestrator (Port 8081)**:
   ```bash
   java -jar order-service/target/order-service-1.0.0.jar
   ```

---

### Step 4: Launch React Frontend UI
In a separate terminal window:
```bash
cd frontend-react
npm install
npm run dev
```
* Open `http://localhost:3000` in your browser!

---

### Step 5: How to Verify & Test Everything Works

1. **Check Eureka Dashboard**: Navigate to `http://localhost:8761`. You should see `API-GATEWAY`, `AUTH-SERVICE`, `ORDER-SERVICE`, `INVENTORY-SERVICE`, `PAYMENT-SERVICE`, and `NOTIFICATION-SERVICE` listed under registered instances!
2. **Login & JWT Test**: On the React UI at `http://localhost:3000`, click **Auth**, login with `user@example.com / password123`, and click **Test Refresh Token**.
3. **Checkout Saga Test**: Click **Place Order**. Observe the live **Saga Orchestration Execution Steps** transition from `PENDING` ➔ `INVENTORY_RESERVED` ➔ `CONFIRMED` ➔ `KAFKA_EVENT_PUBLISHED`.

---
*End of Lesson 9: Docker Compose & Deployment Guide*
