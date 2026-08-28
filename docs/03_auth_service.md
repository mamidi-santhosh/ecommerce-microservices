# 📘 LESSON 3: AUTH SERVICE & DUAL JWT TOKEN ARCHITECTURE

> **Goal**: Master User Registration, Login, Dual Token Security (Short-lived Access Tokens & Long-lived Database Refresh Tokens), and explicit Logout revocation.

---

## 🏬 ELI10 ANALOGY: RIDE WRISTBANDS & VIP CARDS
* **Access Token (15 minutes)**: A paper wristband at an amusement park. Security checks your wristband instantly without looking up your computer file.
* **Refresh Token (7 days)**: A plastic VIP identity card stored in a locked safe (database). When your wristband expires after 15 minutes, you show your VIP card to get a fresh wristband without typing your password again!
* **Logout**: Security shreds your VIP card in the safe so no more wristbands can ever be issued.

---

## ⚙️ CORE IMPLEMENTATION CODE

### 1. `RefreshToken.java` (JPA Entity)
```java
package com.ecommerce.auth.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String token;

    @Column(nullable = false)
    private String userEmail;

    @Column(nullable = false)
    private Instant expiryDate;

    private boolean revoked;

    public RefreshToken() {}
    public RefreshToken(String token, String userEmail, Instant expiryDate, boolean revoked) {
        this.token = token;
        this.userEmail = userEmail;
        this.expiryDate = expiryDate;
        this.revoked = revoked;
    }
    // getters & setters...
}
```

---

### 2. `JwtService.java` (Access Token Generator)
```java
package com.ecommerce.auth.service;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class JwtService {

    @Value("${jwt.secret:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}")
    private String secretKey;

    @Value("${jwt.expiration-ms:900000}") // 15 Minutes
    private long jwtExpirationMs;

    public String generateToken(String email, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(email)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    private Key getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
```

---

### 3. `AuthService.java` (Business Logic)
```java
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;

    // Login Method
    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!user.getPassword().equals(request.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        String accessToken = jwtService.generateToken(user.getEmail(), user.getRole());
        
        // Generate 7-Day Refresh Token
        RefreshToken refreshToken = new RefreshToken(
                UUID.randomUUID().toString(),
                user.getEmail(),
                Instant.now().plus(7, ChronoUnit.DAYS),
                false
        );
        refreshTokenRepository.save(refreshToken);

        return new AuthResponse(accessToken, refreshToken.getToken(), user.getEmail(), user.getRole(), "Login successful!");
    }

    // Refresh Token Exchange Method
    @Transactional
    public AuthResponse refreshToken(RefreshRequest request) {
        RefreshToken token = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new RuntimeException("Refresh token not found"));

        if (token.isRevoked() || token.getExpiryDate().isBefore(Instant.now())) {
            throw new RuntimeException("Refresh token expired or revoked");
        }

        User user = userRepository.findByEmail(token.getUserEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String newAccessToken = jwtService.generateToken(user.getEmail(), user.getRole());
        return new AuthResponse(newAccessToken, token.getToken(), user.getEmail(), user.getRole(), "Token refreshed!");
    }

    // Logout Revocation Method
    @Transactional
    public void logout(String refreshToken) {
        refreshTokenRepository.findByToken(refreshToken).ifPresent(token -> {
            token.setRevoked(true);
            refreshTokenRepository.delete(token); // Permanently delete from DB
        });
    }
}
```

---

## 🎯 INTERVIEW QUESTIONS & ANSWERS

### Q1: Why use Dual Token Authentication (Access + Refresh) instead of a single long-lived token?
> **Answer**: A single long-lived token is a major security risk—if intercepted, an attacker retains access indefinitely until expiration. Short-lived Access Tokens (15m) minimize this vulnerability window. Stateless Access Tokens allow API Gateway to validate requests at high speeds. Refresh Tokens (7d) are stored in database and allow silent renewal while enabling instant revocation during Logout by deleting the database record.

---
*End of Lesson 3: Auth Service & Dual JWT Token Architecture*
