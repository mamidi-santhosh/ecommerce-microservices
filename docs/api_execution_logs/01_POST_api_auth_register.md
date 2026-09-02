# 📄 API EXECUTION LOG: `POST /api/auth/register`

---

## 1. 🌐 API METADATA & REQUEST PAYLOAD

* **HTTP Method**: `POST`
* **Full URL**: `http://localhost:8080/api/auth/register`
* **Target Microservice**: `auth-service` (Port `8085`) via `api-gateway` (Port `8080`)
* **Public / Protected**: Public Endpoint (Bypasses JWT Filter)
* **Headers**:
  ```http
  Content-Type: application/json
  ```
* **Request Body JSON**:
  ```json
  {
    "email": "newuser@example.com",
    "password": "password123",
    "name": "New E-Commerce User"
  }
  ```

---

## 2. 🗺️ NETWORK REQUEST TRAVERSAL & MICROSERVICE FLOW

```
[React App / Postman]
       │
       │ HTTP POST /api/auth/register
       ▼
[API Gateway :8080]
       │
       ├─▶ AuthenticationFilter (Bypasses JWT check: path starts with /api/auth/register)
       │
       ├─▶ Eureka Resolver (Resolves lb://auth-service ➔ http://localhost:8085)
       ▼
[Auth Service :8085]
       │
       ├─▶ SecurityFilterChain (Spring Security 6 permits /api/auth/**)
       ├─▶ AuthController.register()
       ├─▶ AuthService.register()
       │      ├─▶ BCryptPasswordEncoder.encode("password123")
       │      ├─▶ UserRepository.save(user) ➔ MySQL (users table)
       │      ├─▶ JwtService.generateAccessToken() ➔ HMAC-SHA256 (15 mins)
       │      └─▶ RefreshTokenRepository.save(token) ➔ MySQL (refresh_tokens table)
       ▼
[HTTP 200 OK Response with Access & Refresh Tokens]
```

---

## 3. 🧑‍💻 CODE FILE & LINE TRAVERSAL TRACE

1. **Gateway Public Filter Bypass**:
   [`AuthenticationFilter.java:L41-L44`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/api-gateway/src/main/java/com/ecommerce/gateway/filter/AuthenticationFilter.java#L41-L44)
   * `PUBLIC_ENDPOINTS.stream().anyMatch(path::startsWith)` matches `/api/auth/register` and skips token validation.

2. **Auth Service Spring Security 6 Permitting**:
   [`SecurityConfig.java:L29-L32`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/auth-service/src/main/java/com/ecommerce/auth/config/SecurityConfig.java#L29-L32)
   * `requestMatchers("/api/auth/**").permitAll()` lets the request reach `AuthController`.

3. **Controller Handling**:
   [`AuthController.java:L25-L28`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/auth-service/src/main/java/com/ecommerce/auth/controller/AuthController.java#L25-L28)
   * Calls `authService.register(request)`.

4. **BCrypt Password Encoding & DB Save**:
   [`AuthService.java:L53-L58`](file:///c:/Users/santh/.gemini/antigravity-ide/scratch/ecommerce-microservices/auth-service/src/main/java/com/ecommerce/auth/service/AuthService.java#L53-L58)
   * Hashes `password123` via `passwordEncoder.encode()`.
   * Saves `User` entity to database with role `ROLE_USER`.
   * Generates 15-minute Access Token and 7-day Refresh Token.

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
* **Table `refresh_tokens`**:
  ```sql
  Empty set (0 rows)
  ```

---

### 🔹 Executed SQL Statements (Hibernate ORM):
```sql
-- 1. Check if email exists
SELECT COUNT(*) FROM users WHERE email = 'newuser@example.com';

-- 2. Insert new user with BCrypt hashed password
INSERT INTO users (email, password, name, role) 
VALUES ('newuser@example.com', '$2a$10$aX9vP2kQ...', 'New E-Commerce User', 'ROLE_USER');

-- 3. Insert generated 7-day Refresh Token
INSERT INTO refresh_tokens (token, user_id, expiry_date, revoked) 
VALUES ('b4a8e2d1-9c3f-4e8a-8120-7f2a1b90c3d4', 2, '2026-09-09 11:58:20', 0);
```

---

### 🔹 Database State AFTER API Call:

* **Table `users`**:
  ```sql
  +----+---------------------+--------------------------------------------------------------+---------------------+-----------+
  | id | email               | password                                                     | name                | role      |
  +----+---------------------+--------------------------------------------------------------+---------------------+-----------+
  |  1 | user@example.com    | $2a$10$e8Z4k9Vq...                                           | Demo User           | ROLE_USER |
  |  2 | newuser@example.com | $2a$10$aX9vP2kQ... (BCrypt salted hash)                     | New E-Commerce User | ROLE_USER |
  +----+---------------------+--------------------------------------------------------------+---------------------+-----------+
  ```

* **Table `refresh_tokens`**:
  ```sql
  +----+--------------------------------------+---------+---------------------+---------+
  | id | token                                | user_id | expiry_date         | revoked |
  +----+--------------------------------------+---------+---------------------+---------+
  |  1 | b4a8e2d1-9c3f-4e8a-8120-7f2a1b90c3d4 |       2 | 2026-09-09 11:58:20 |       0 |
  +----+--------------------------------------+---------+---------------------+---------+
  ```

---

## 5. ⚡ REDIS & KAFKA BEHAVIOR

* **Redis Cache**: Unaffected (Auth operations do not read/write product cache).
* **Kafka Event Bus**: Unaffected.

---

## 6. 📤 RESPONSE PAYLOAD & HTTP STATUS

* **HTTP Status Code**: `200 OK`
* **Response Body JSON**:
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJuZXd1c2VyQGV4YW1wbGUuY29tIiwicm9sZSI6IlJPTEVfVVNFUiIsImlhdCI6MTc4ODMyOTg1OCwiZXhwIjoxNzg4MzMwNzg4fQ...",
    "refreshToken": "b4a8e2d1-9c3f-4e8a-8120-7f2a1b90c3d4",
    "email": "newuser@example.com",
    "name": "New E-Commerce User",
    "role": "ROLE_USER",
    "message": "User registered successfully!"
  }
  ```
