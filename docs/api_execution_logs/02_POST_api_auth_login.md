# 📄 API EXECUTION LOG: `POST /api/auth/login`

---

## 1. 🌐 API METADATA & REQUEST PAYLOAD

* **HTTP Method**: `POST`
* **Full URL**: `http://localhost:8080/api/auth/login`
* **Target Microservice**: `auth-service` (Port `8085`) via `api-gateway` (Port `8080`)
* **Public / Protected**: Public Endpoint
* **Headers**:
  ```http
  Content-Type: application/json
  ```
* **Request Body JSON**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

---

## 2. 🗺️ NETWORK REQUEST TRAVERSAL & MICROSERVICE FLOW

```
[React App / Postman]
       │
       │ HTTP POST /api/auth/login
       ▼
[API Gateway :8080]
       │
       ├─▶ AuthenticationFilter (Bypasses JWT check: path starts with /api/auth/login)
       ├─▶ Eureka Resolver (Resolves lb://auth-service ➔ http://localhost:8085)
       ▼
[Auth Service :8085]
       │
       ├─▶ SecurityFilterChain (Spring Security 6 permits /api/auth/**)
       ├─▶ AuthController.login()
       ├─▶ AuthService.login()
       │      ├─▶ UserRepository.findByEmail("user@example.com")
       │      ├─▶ PasswordEncoder.matches("password123", user.getPassword()) [BCrypt verification]
       │      ├─▶ JwtService.generateAccessToken("user@example.com", "ROLE_USER") [15m expiration]
       │      └─▶ createRefreshToken(user) ➔ Deletes old refresh token, saves new UUID in MySQL
       ▼
[HTTP 200 OK Response with Access & Refresh Tokens]
```

---

## 3. 🧑‍💻 CODE FILE & LINE TRAVERSAL TRACE

1. **Gateway Public Filter Bypass**:
   [`AuthenticationFilter.java:L41-L44`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/api-gateway/src/main/java/com/ecommerce/gateway/filter/AuthenticationFilter.java#L41-L44)

2. **Controller Entry**:
   [`AuthController.java:L30-L33`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/auth-service/src/main/java/com/ecommerce/auth/controller/AuthController.java#L30-L33)

3. **BCrypt Password Verification & Token Generation**:
   [`AuthService.java:L70-L88`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/auth-service/src/main/java/com/ecommerce/auth/service/AuthService.java#L70-L88)
   * `passwordEncoder.matches(request.getPassword(), user.getPassword())` compares raw text with BCrypt hash.
   * `jwtService.generateAccessToken()` creates HMAC-SHA256 token.
   * `createRefreshToken()` persists a new 7-day UUID token to database.

---

## 4. 🗄️ DATABASE STATE (MySQL `ecommerce_db`) BEFORE VS AFTER

### 🔹 Database State BEFORE API Call:
* **Table `users`**:
  ```sql
  +----+------------------+--------------------------------------------------------------+------------+-----------+
  | id | email            | password                                                     | name       | role      |
  +----+------------------+--------------------------------------------------------------+------------+-----------+
  |  1 | user@example.com | $2a$10$e8Z4k9Vq... (BCrypt hash for password123)            | Demo User  | ROLE_USER |
  +----+------------------+--------------------------------------------------------------+------------+-----------+
  ```

---

### 🔹 Executed SQL Statements (Hibernate ORM):
```sql
-- 1. Fetch user by email
SELECT id, email, name, password, role FROM users WHERE email = 'user@example.com';

-- 2. Delete any existing refresh token for this user
DELETE FROM refresh_tokens WHERE user_id = 1;

-- 3. Insert newly generated 7-day Refresh Token
INSERT INTO refresh_tokens (token, user_id, expiry_date, revoked) 
VALUES ('c5f9d3a2-1e4b-4f70-9831-6d2c4e8f1b5a', 1, '2026-09-09 11:58:30', 0);
```

---

### 🔹 Database State AFTER API Call:
* **Table `refresh_tokens`**:
  ```sql
  +----+--------------------------------------+---------+---------------------+---------+
  | id | token                                | user_id | expiry_date         | revoked |
  +----+--------------------------------------+---------+---------------------+---------+
  |  2 | c5f9d3a2-1e4b-4f70-9831-6d2c4e8f1b5a |       1 | 2026-09-09 11:58:30 |       0 |
  +----+--------------------------------------+---------+---------------------+---------+
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
    "accessToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyQGV4YW1wbGUuY29tIiwicm9sZSI6IlJPTEVfVVNFUiIsImlhdCI6MTc4ODMyOTg1OCwiZXhwIjoxNzg4MzMwNzg4fQ...",
    "refreshToken": "c5f9d3a2-1e4b-4f70-9831-6d2c4e8f1b5a",
    "email": "user@example.com",
    "name": "Demo User",
    "role": "ROLE_USER",
    "message": "Login successful!"
  }
  ```
