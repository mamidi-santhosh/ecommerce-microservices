# 📄 API EXECUTION LOG: `GET /api/products`

---

## 1. 🌐 API METADATA & REQUEST PAYLOAD

* **HTTP Method**: `GET`
* **Full URL**: `http://localhost:8080/api/products`
* **Target Microservice**: `inventory-service` (Port `8082`) via `api-gateway` (Port `8080`)
* **Public / Protected**: Public Endpoint
* **Headers**: None required

---

## 2. 🗺️ NETWORK REQUEST TRAVERSAL & MICROSERVICE FLOW

```
[React App / Postman]
       │
       │ HTTP GET /api/products
       ▼
[API Gateway :8080]
       │
       ├─▶ AuthenticationFilter (Bypasses JWT check: /api/products is public)
       ├─▶ Eureka Resolver (Resolves lb://inventory-service ➔ http://localhost:8082)
       ▼
[Inventory Service :8082]
       │
       ├─▶ ProductController.getProducts()
       ├─▶ InventoryService.getAllProducts()
       │      ├─▶ Step 1: Check Redis Cache (`catalog:products`)
       │      │     ├── 🟢 CACHE HIT  ➔ Return cached JSON instantly from Redis memory!
       │      │     └── 🔴 CACHE MISS ➔ Query MySQL DB ➔ Write to Redis (60s TTL) ➔ Return JSON
       ▼
[HTTP 200 OK Response with Product List]
```

---

## 3. 🧑‍💻 CODE FILE & LINE TRAVERSAL TRACE

1. **Gateway Filter Bypass**:
   [`AuthenticationFilter.java:L29`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/api-gateway/src/main/java/com/ecommerce/gateway/filter/AuthenticationFilter.java#L29)

2. **Controller Endpoint**:
   [`ProductController.java:L20-L24`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/inventory-service/src/main/java/com/ecommerce/inventory/controller/ProductController.java#L20-L24)

3. **Redis Cache-Aside Logic**:
   [`InventoryService.java:L35-L48`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/inventory-service/src/main/java/com/ecommerce/inventory/service/InventoryService.java#L35-L48)
   * `redisTemplate.opsForValue().get("catalog:products")`
   * On cache miss: `productRepository.findAll()` MySQL query ➔ `redisTemplate.opsForValue().set("catalog:products", json, Duration.ofSeconds(60))`.

---

## 4. 🗄️ DATABASE STATE (MySQL `ecommerce_db`) BEFORE VS AFTER

### 🔹 Database State BEFORE API Call:
* **Table `products`**:
  ```sql
  +----+--------------+------------------------+--------+-------+
  | id | sku          | name                   | price  | stock |
  +----+--------------+------------------------+--------+-------+
  |  1 | PROD-NEO-01  | Cyberpunk Neo Laptop   | 1499.99|    50 |
  |  2 | PROD-CYBER-02| Cybernetic VR Goggles  |  799.99|    30 |
  +----+--------------+------------------------+--------+-------+
  ```

---

### 🔹 Executed SQL Statements (Hibernate ORM):
```sql
-- Executed ONLY on Redis Cache Miss:
SELECT id, sku, name, price, stock FROM products;
```

---

### 🔹 Database State AFTER API Call:
* **Table `products`**: Unchanged.

---

## 5. ⚡ REDIS & KAFKA BEHAVIOR

* **Redis Cache State**:
  * Key: `catalog:products`
  * Value: `[{"id":1,"sku":"PROD-NEO-01","name":"Cyberpunk Neo Laptop","price":1499.99,"stock":50}, ...]`
  * TTL: `60 Seconds`
* **Kafka Event Bus**: None.

---

## 6. 📤 RESPONSE PAYLOAD & HTTP STATUS

* **HTTP Status Code**: `200 OK`
* **Response Body JSON**:
  ```json
  [
    {
      "id": 1,
      "sku": "PROD-NEO-01",
      "name": "Cyberpunk Neo Laptop",
      "price": 1499.99,
      "stock": 50
    },
    {
      "id": 2,
      "sku": "PROD-CYBER-02",
      "name": "Cybernetic VR Goggles",
      "price": 799.99,
      "stock": 30
    }
  ]
  ```
