# 📄 API EXECUTION LOG: `POST /api/auth/refresh`

---

## 1. 🌐 API METADATA & REQUEST PAYLOAD

* **HTTP Method**: `POST`
* **Full URL**: `http://localhost:8080/api/auth/refresh`
* **Target Microservice**: `auth-service` (Port `8085`) via `api-gateway` (Port `8080`)
* **Public / Protected**: Public Endpoint (Used when 15-minute Access Token has expired)
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
       │ HTTP POST /api/auth/refresh
       ▼
[API Gateway :8080]
       │
       ├─▶ AuthenticationFilter (Bypasses JWT check: path starts with /api/auth/refresh)
       ├─▶ Eureka Resolver (Resolves lb://auth-service ➔ http://localhost:8085)
       ▼
[Auth Service :8085]
       │
       ├─▶ SecurityFilterChain (Spring Security 6 permits /api/auth/**)
       ├─▶ AuthController.refreshToken()
       ├─▶ AuthService.refreshAccessToken()
       │      ├─▶ RefreshTokenRepository.findByToken("c5f9d3a2-1e4b-4f70-9831-6d2c4e8f1b5a")
       │      ├─▶ Check: Revoked? Expired? (If valid, proceed)
       │      └─▶ JwtService.generateAccessToken(user.getEmail(), user.getRole()) [New 15m Token]
       ▼
[HTTP 200 OK Response with Fresh Access Token]
```

---

## 3. 🧑‍💻 CODE FILE & LINE TRAVERSAL TRACE

1. **Controller Entry**:
   [`AuthController.java:L35-L38`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/auth-service/src/main/java/com/ecommerce/auth/controller/AuthController.java#L35-L38)

2. **Database Verification & Token Renewal**:
   [`AuthService.java:L91-L117`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/auth-service/src/main/java/com/ecommerce/auth/service/AuthService.java#L91-L117)
   * `refreshTokenRepository.findByToken()` retrieves token record from MySQL.
   * Verifies `!refreshToken.isRevoked()` and `expiryDate.isAfter(Instant.now())`.
   * Invokes `jwtService.generateAccessToken()` to create a fresh 15-minute JWT without asking user to enter their password.

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
-- Fetch refresh token and associated user entity
SELECT t.id, t.token, t.expiry_date, t.revoked, u.email, u.name, u.role 
FROM refresh_tokens t 
JOIN users u ON t.user_id = u.id 
WHERE t.token = 'c5f9d3a2-1e4b-4f70-9831-6d2c4e8f1b5a';
```

---

### 🔹 Database State AFTER API Call:
* **Table `refresh_tokens`**: Unchanged (Token remains active and valid).

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
    "accessToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyQGV4YW1wbGUuY29tIiwicm9sZSI6IlJPTEVfVVNFUiIsImlhdCI6MTc4ODMzMDkwMCwiZXhwIjoxNzg4MzMxODAwfQ...",
    "refreshToken": "c5f9d3a2-1e4b-4f70-9831-6d2c4e8f1b5a",
    "email": "user@example.com",
    "name": "Demo User",
    "role": "ROLE_USER",
    "message": "Access Token refreshed successfully!"
  }
  ```
