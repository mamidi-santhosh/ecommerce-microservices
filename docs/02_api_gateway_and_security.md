# 📘 LESSON 2: API GATEWAY & GLOBAL JWT AUTHENTICATION

> **Goal**: Master Spring Cloud Gateway (WebFlux), route definitions, CORS policy, and the Global JWT Authentication Filter that secures protected endpoints across the entire system.

---

## 🏬 ELI10 ANALOGY: THE MALL SECURITY GUARD
The API Gateway is the **Security Guard** standing at the front entrance of the Shopping Mall!
* Every single visitor enters through the Gateway door.
* Public shops (like Auth login or Product catalog) are open to everyone without showing an ID.
* Private rooms (like Orders or Payments) require showing a valid **15-minute wristband (Access Token)** to the guard.
* The guard validates your wristband on the spot. If valid, he writes your email address (`X-User-Email`) on a name tag and lets you pass!

---

## ⚙️ GATEWAY CODE & CONFIGURATION

### 1. `api-gateway/src/main/resources/application.yml`
```yaml
server:
  port: 8080

spring:
  application:
    name: api-gateway
  cloud:
    gateway:
      cors-configurations:
        '[/**]':
          allowedOrigins: "*"
          allowedMethods: "*"
          allowedHeaders: "*"
      routes:
        - id: auth-service
          uri: lb://auth-service
          predicates:
            - Path=/api/auth/**

        - id: order-service
          uri: lb://order-service
          predicates:
            - Path=/api/orders/**

        - id: inventory-service
          uri: lb://inventory-service
          predicates:
            - Path=/api/inventory/**, /api/products/**

        - id: payment-service
          uri: lb://payment-service
          predicates:
            - Path=/api/payments/**

jwt:
  secret: 404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
```

---

### 2. `AuthenticationFilter.java`
```java
package com.ecommerce.gateway.filter;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
public class AuthenticationFilter implements GlobalFilter, Ordered {

    private final JwtValidator jwtValidator;

    private static final List<String> PUBLIC_ENDPOINTS = List.of(
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/refresh",
            "/api/products"
    );

    public AuthenticationFilter(JwtValidator jwtValidator) {
        this.jwtValidator = jwtValidator;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();

        // 1. Bypass validation for public endpoints
        if (PUBLIC_ENDPOINTS.stream().anyMatch(path::startsWith)) {
            return chain.filter(exchange);
        }

        // 2. Extract Authorization Header
        if (!request.getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        String token = authHeader.substring(7);

        // 3. Validate JWT Token Signature & Expiry
        if (!jwtValidator.validateToken(token)) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        // 4. Extract Claims & Inject Custom Headers Downstream
        String username = jwtValidator.extractUsername(token);
        String role = jwtValidator.extractRole(token);

        ServerHttpRequest modifiedRequest = request.mutate()
                .header("X-User-Email", username != null ? username : "anonymous")
                .header("X-User-Role", role != null ? role : "ROLE_USER")
                .build();

        return chain.filter(exchange.mutate().request(modifiedRequest).build());
    }

    @Override
    public int getOrder() {
        return -1; // Highest priority execution
    }
}
```

---

## 🎯 INTERVIEW QUESTIONS & ANSWERS

### Q1: How does API Gateway handle security without querying the database on every request?
> **Answer**: By using **Stateless Access Tokens (JWT)**. The API Gateway validates the HMAC-SHA256 signature of incoming JWT tokens locally using a shared secret key. Because the payload contains the user email and roles, the Gateway verifies authenticity in memory in sub-milliseconds without performing slow database network lookups.

### Q2: What is the difference between Spring Cloud Gateway and traditional Netflix Zuul?
> **Answer**: Netflix Zuul 1.x was blocking and synchronous (servlet-based, 1 thread per request model), which struggled under high concurrency. Spring Cloud Gateway is built on **Spring WebFlux and Netty**, using a non-blocking asynchronous event loop model that can handle tens of thousands of concurrent connections efficiently.

---
*End of Lesson 2: API Gateway & Global JWT Authentication*
