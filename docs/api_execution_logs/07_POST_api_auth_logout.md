# 📄 API EXECUTION LOG: `POST /api/auth/logout`

---

## 1. 🌐 API METADATA & REQUEST PAYLOAD

* **HTTP Method**: `POST`
* **Full URL**: `http://localhost:8080/api/auth/logout`
* **Target Microservice**: `auth-service` (Port `8085`) via `api-gateway` (Port `8080`)
* **Public / Protected**: Public Endpoint
* **Headers**:
  ```http
  Content-Type: application/json
  ```
* **Request Body JSON**:
  ```json
  {
    "refreshToken": "c5f9d3a2-1e4b-4f70-9831-6d2c4e8f1b5a"
  }
  ```

---

## 2. 🗺️ NETWORK REQUEST TRAVERSAL & MICROSERVICE FLOW

```
[React App / Postman]
       │
       │ HTTP POST /api/auth/logout
       ▼
[API Gateway :8080]
       │
       ├─▶ AuthenticationFilter (Bypasses JWT check for logout request)
       ├─▶ Eureka Resolver (Resolves lb://auth-service ➔ http://localhost:8085)
       ▼
[Auth Service :8085]
       │
       ├─▶ SecurityFilterChain (Spring Security 6 permits /api/auth/**)
       ├─▶ AuthController.logout()
       ├─▶ AuthService.logout()
       │      ├─▶ RefreshTokenRepository.findByToken("c5f9d3a2-1e4b-4f70-9831-6d2c4e8f1b5a")
       │      ├─▶ refreshToken.setRevoked(true)
       │      └─▶ RefreshTokenRepository.delete(refreshToken) ➔ Permanently deletes record in MySQL DB!
       ▼
[HTTP 200 OK Response "Logged out successfully!"]
```

---

## 3. 🧑‍💻 CODE FILE & LINE TRAVERSAL TRACE

1. **Controller Entry**:
   [`AuthController.java:L40-L47`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/auth-service/src/main/java/com/ecommerce/auth/controller/AuthController.java#L40-L47)

2. **Database Token Revocation & Deletion**:
   [`AuthService.java:L120-L130`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/auth-service/src/main/java/com/ecommerce/auth/service/AuthService.java#L120-L130)
   * `refreshToken.setRevoked(true)`
   * `refreshTokenRepository.delete(refreshToken)` executes SQL `DELETE` in MySQL so no future token refreshes can occur.

---

## 4. 🗄️ DATABASE STATE (MySQL `ecommerce_db`) BEFORE VS AFTER

### 🔹 Database State BEFORE API Call:
* **Table `refresh_tokens`**:
  ```sql
  +----+--------------------------------------+---------+---------------------+---------+
  | id | token                                | user_id | expiry_date         | revoked |
  +----+--------------------------------------+---------+---------------------+---------+
  |  2 | c5f9d3a2-1e4b-4f70-9831-6d2c4e8f1b5a |       1 | 2026-09-09 11:58:30 |       0 |
  +----+--------------------------------------+---------+---------------------+---------+
  ```

---

### 🔹 Executed SQL Statements (Hibernate ORM):
```sql
-- 1. Locate refresh token in DB
SELECT id, token, user_id, expiry_date, revoked FROM refresh_tokens WHERE token = 'c5f9d3a2-1e4b-4f70-9831-6d2c4e8f1b5a';

-- 2. Revoke and delete token from database
DELETE FROM refresh_tokens WHERE id = 2;
```

---

### 🔹 Database State AFTER API Call:

* **Table `refresh_tokens`**:
  ```sql
  Empty set (0 rows)
  ```

---

## 5. ⚡ REDIS & KAFKA BEHAVIOR

* **Redis Cache**: None.
* **Kafka Event Bus**: None.

---

## 6. 📤 RESPONSE PAYLOAD & HTTP STATUS

* **HTTP Status Code**: `200 OK`
* **Response Body JSON**:
  ```json
  {
    "message": "Logged out successfully! Refresh token revoked and deleted."
  }
  ```
