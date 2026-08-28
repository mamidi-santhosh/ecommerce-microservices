# 📘 LESSON 1: SYSTEM ARCHITECTURE & EUREKA SERVICE DISCOVERY

> **Goal**: Understand the overall Microservices Architecture blueprint and how Eureka Service Registry enables dynamic service lookup without hardcoded IP addresses.

---

## 🏬 ELI10 ANALOGY: THE MALL INFORMATION DESK
Imagine every store in a giant shopping mall moves to a new room every morning! How do shoppers find the Inventory store or Payment store?
They check the **Information Desk** at the main entrance!
* Every store calls the Information Desk every 30 seconds saying: *"Hi! I'm Inventory Store and today I am working at Room #192.168.1.10!"*
* When the Order Store wants to talk to Inventory Store, it asks the Information Desk for the current room number instead of walking around randomly!

---

## 🏗️ SYSTEM ARCHITECTURE OVERVIEW

```
  ┌──────────────────────────────────────────────────────────┐
  │                 📱 FRONTEND REACT (3000)                │
  └─────────────────────────────┬────────────────────────────┘
                                │ HTTP / REST + Authorization: Bearer <JWT>
                                ▼
  ┌──────────────────────────────────────────────────────────┐
  │                 ⚡ API GATEWAY (8080)                     │
  │                 Global JWT Filter & CORS                 │
  └─────────────────────────────┬────────────────────────────┘
                                │ Eureka Service Lookup
                                ▼
  ┌──────────────────────────────────────────────────────────┐
  │              🔎 EUREKA SERVER (Port 8761)                │
  │              Central Registry & Health Check             │
  └─────────────────────────────┬────────────────────────────┘
                                │
       ┌────────────────────────┼────────────────────────┬────────────────────────┐
       │                        │                        │                        │
       ▼                        ▼                        ▼                        ▼
┌──────────────┐         ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│ 🔐 AUTH      │         │ 🛒 ORDER     │         │ 📦 INVENTORY │         │ 💳 PAYMENT   │
│ SERVICE      │         │ SERVICE      │────────▶│ SERVICE      │         │ SERVICE      │
│ (Port 8085)  │         │ (Port 8085)  │  Feign  │ (Port 8082)  │         │ (Port 8083)  │
└──────────────┘         └──────┬───────┘         └──────┬───────┘         └──────────────┘
                                │                        │
                                │ Kafka Event            ▼
                                ▼                 ┌──────────────┐
                         ┌──────────────┐         │ 🟥 REDIS     │
                         │ 🐘 KAFKA     │         │ (Port 6379)  │
                         │ (Port 9092)  │         └──────────────┘
                         └──────┬───────┘
                                │ Consumer
                                ▼
                         ┌──────────────┐
                         │ 🔔 NOTIFY    │
                         │ SERVICE      │
                         │ (Port 8084)  │
                         └──────────────┘
```

---

## ⚙️ EUREKA SERVER IMPLEMENTATION CODE

### 1. `eureka-server/pom.xml`
```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-server</artifactId>
</dependency>
```

### 2. `eureka-server/src/main/resources/application.yml`
```yaml
server:
  port: 8761

eureka:
  instance:
    hostname: localhost
  client:
    register-with-eureka: false  # Eureka Server does not register with itself
    fetch-registry: false        # Does not fetch registry from elsewhere
    service-url:
      defaultZone: http://${eureka.instance.hostname}:${server.port}/eureka/
```

### 3. `EurekaServerApplication.java`
```java
package com.ecommerce.eureka;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

@SpringBootApplication
@EnableEurekaServer
public class EurekaServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(EurekaServerApplication.class, args);
    }
}
```

---

## 🎯 INTERVIEW QUESTIONS & ANSWERS

### Q1: What problem does Service Discovery solve in a Microservices Architecture?
> **Answer**: In cloud platforms (like Docker, Kubernetes, AWS), microservice instances scale horizontally and dynamically restart with temporary IP addresses. Service Discovery (Eureka) provides a dynamic central directory. Services register their network locations on startup and resolve downstream endpoints by logical service name (`lb://inventory-service`) rather than hardcoding IP addresses.

### Q2: How does Eureka know if a microservice instance is dead?
> **Answer**: Microservice clients send periodic **heartbeat ping signals** (every 30 seconds by default) to the Eureka Server. If Eureka does not receive a heartbeat within a eviction threshold (e.g., 90 seconds), it automatically removes that instance from its registry.

---
*End of Lesson 1: System Architecture & Eureka Service Discovery*
