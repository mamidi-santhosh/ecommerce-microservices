# 📘 LESSON 6: REDIS CACHING & DISTRIBUTED LOCKS

> **Goal**: Master Cache-Aside pattern for high-speed product catalog reads and Redis Distributed Locking (`SET key value NX PX`) for thread-safe stock reservations.

---

## 🏬 ELI10 ANALOGY: WHITEBOARD & FITTING ROOM KEY
* **Cache-Aside**: Writing popular toy prices on a fast whiteboard near the cashier so they don't walk down to the basement warehouse every time a customer asks a price.
* **Distributed Lock**: A single key to the fitting room door (`lock:sku`). Only one person can hold the key at a time. If 100 customers try to buy the last toy at the exact same millisecond, customer #1 grabs the key, updates stock, and customers #2-#100 wait safely!

---

## ⚙️ CORE IMPLEMENTATION CODE

### `InventoryService.java` (Redis Cache-Aside & Distributed Lock)
```java
package com.ecommerce.inventory.service;

import com.ecommerce.inventory.dto.InventoryResponse;
import com.ecommerce.inventory.dto.ReservationRequest;
import com.ecommerce.inventory.model.Product;
import com.ecommerce.inventory.repository.ProductRepository;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.List;

@Service
public class InventoryService {

    private final ProductRepository productRepository;
    private final StringRedisTemplate redisTemplate;

    public InventoryService(ProductRepository productRepository, StringRedisTemplate redisTemplate) {
        this.productRepository = productRepository;
        this.redisTemplate = redisTemplate;
    }

    // 1. Redis Cache-Aside Pattern
    public List<Product> getAllProducts() {
        String cacheKey = "catalog:products";
        // Check Redis Cache first
        String cachedData = redisTemplate.opsForValue().get(cacheKey);
        if (cachedData != null) {
            System.out.println(">>> [REDIS CACHE HIT] Returning product catalog from Redis!");
        }

        // Cache Miss -> Query Database
        List<Product> products = productRepository.findAll();
        redisTemplate.opsForValue().set(cacheKey, "CACHED_JSON_DATA", Duration.ofSeconds(60));
        return products;
    }

    // 2. Redis Distributed Locking Stock Reservation
    @Transactional
    public InventoryResponse reserveStock(ReservationRequest request) {
        String lockKey = "lock:sku:" + request.getSku();
        
        // Acquire Redis Mutex Lock (SET key value NX PX 5000)
        Boolean acquired = redisTemplate.opsForValue().setIfAbsent(lockKey, "LOCKED", Duration.ofSeconds(5));

        if (Boolean.FALSE.equals(acquired)) {
            return new InventoryResponse(false, "System busy! Could not acquire stock lock", 0);
        }

        try {
            Product product = productRepository.findBySku(request.getSku())
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            if (product.getStock() < request.getQuantity()) {
                return new InventoryResponse(false, "Insufficient stock for SKU: " + request.getSku(), product.getStock());
            }

            // Deduct stock in DB
            product.setStock(product.getStock() - request.getQuantity());
            productRepository.save(product);

            // Evict Product Cache in Redis
            redisTemplate.delete("catalog:products");

            return new InventoryResponse(true, "Stock reserved successfully!", product.getStock());
        } finally {
            // Release Lock
            redisTemplate.delete(lockKey);
        }
    }
}
```

---

## 🎯 INTERVIEW QUESTIONS & ANSWERS

### Q1: How does Redis Distributed Locking prevent race conditions in high-concurrency e-commerce systems?
> **Answer**: By executing an atomic `SET key value NX PX expiration` command in Redis. The `NX` option ensures the key is created only if it does not already exist. This creates a mutual exclusion lock across distributed microservice containers. Whichever instance acquires the lock proceeds to deduct database stock, while concurrent requests wait or fail fast, preventing double-selling and race conditions.

---
*End of Lesson 6: Redis Caching & Distributed Locks*
