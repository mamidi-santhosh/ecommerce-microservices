---
name: springboot-heap-memory-testing
description: Complete step-by-step guide and template for conducting JVM Heap Memory Testing, Leak Detection, Load Profiling, and Heap Dump Analysis on any Spring Boot application deployed on embedded or standalone Tomcat.
---

# 🧠 Spring Boot JVM Heap Memory Testing & Profiling Skill

This skill provides an end-to-end framework for performance testing, heap profiling, memory leak detection, and Heap Dump analysis for any Spring Boot Java application running on Tomcat.

---

## 📐 1. JVM Memory Architecture Overview

JVM Heap memory is divided into distinct pools managed by Garbage Collectors (e.g., G1GC):

* **Young Generation (YoungGen)**:
  * **Eden Space**: New object allocations (`new User()`).
  * **Survivor Spaces (S0 / S1)**: Objects that survived minor GC.
* **Old Generation (Tenured / OldGen)**: Long-lived objects promoted from YoungGen after reaching aging threshold (e.g., Spring Singletons, Session caches).
* **Metaspace**: Native memory holding class definitions, bytecode, and method data.

---

## 🛠️ 2. Essential Tools Required

| Tool | Purpose | How to Access |
| :--- | :--- | :--- |
| **Spring Boot Actuator** | Real-time heap metrics & heapdump download | `GET /actuator/metrics/jvm.memory.used`, `GET /actuator/heapdump` |
| **Postman / Newman CLI** | Run entire Postman Collections under load | `newman run collection.json -n 500` |
| **k6 / JMeter** | Multi-API scenario load generation | `k6 run load_test.js` |
| **JDK `jcmd`** | Command-line diagnostic & Heap Dump capture | Included in JDK (`jcmd <pid> GC.heap_dump`) |
| **JDK `jstat`** | Real-time GC stats & heap pool usage | Included in JDK (`jstat -gcutil <pid> 1000`) |
| **Eclipse MAT** | Deep Memory Leak Analysis (`.hprof` dumps) | Desktop Analysis App |

---

## ⚙️ 3. JVM Startup Flags Setup (Mandatory)

Always configure your Spring Boot container with explicit memory boundaries and automated dump capture on Out-Of-Memory (`OOM`):

```bash
java -Xms256m -Xmx512m \
     -XX:+UseG1GC \
     -XX:+HeapDumpOnOutOfMemoryError \
     -XX:HeapDumpPath=/var/logs/heap_dump.hprof \
     -jar app.jar
```

---

## 🧪 4. Step-by-Step Heap Memory Testing Protocol

### STEP 1: Find Application Process ID (PID)
```bash
jcmd -l
```

### STEP 2: Record Baseline Idle Memory
```bash
# Monitor GC activity (sample every 1 second)
jstat -gcutil <PID> 1000
```

---

### STEP 3: Execute Load Testing on Postman Collection / Multiple APIs

#### 🏆 Method A: Using Postman Collection via Newman CLI (Recommended)
You can run your entire exported Postman collection JSON file with `n` iterations or concurrent users directly from the command line:

1. Install Newman (Postman CLI):
   ```bash
   npm install -g newman
   ```
2. Run your Postman Collection 500 times in sequence across all your APIs:
   ```bash
   newman run your_postman_collection.json -n 500
   ```

---

#### ⚡ Method B: Using Postman GUI (Performance Test Tab)
1. Open **Postman** ➔ Select your Collection.
2. Click **Run Collection**.
3. Select **Performance Tab**:
   * **Virtual Users**: `50`
   * **Test Duration**: `5 minutes`
4. Click **Run** to fire concurrent traffic across all APIs in your collection while monitoring `jstat`!

---

#### 🔄 Method C: Dynamic Multi-API Scenario Script (k6)
Create a `load_test.js` that cycles through all API endpoints (Login ➔ Fetch Products ➔ Place Order):

```javascript
// load_test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 20 },  // Ramp up to 20 users
    { duration: '5m', target: 100 }, // Sustained load at 100 users
    { duration: '1m', target: 0 },   // Ramp down
  ],
};

export default function () {
  const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

  // 1. Auth Login API
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  }), { headers: { 'Content-Type': 'application/json' } });

  const token = loginRes.json('accessToken');
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 2. Fetch Products API
  http.get(`${BASE_URL}/api/products`);

  // 3. Place Order API
  http.post(`${BASE_URL}/api/orders`, JSON.stringify({
    customerEmail: 'user@example.com',
    sku: 'PROD-NEO-01',
    quantity: 1,
    amount: 199.99
  }), { headers: authHeaders });

  sleep(0.2);
}
```
Run command: `k6 run -e BASE_URL=http://localhost:8080 load_test.js`

---

### STEP 4: Trigger Live Heap Dump Capture
While under load or immediately after load stops:

```bash
# Capture Heap Dump via jcmd
jcmd <PID> GC.heap_dump ./live_heapdump.hprof
```

---

## 🔍 5. Heap Dump Analysis in Eclipse MAT

1. Open **Eclipse MAT** ➔ File ➔ Open Heap Dump ➔ Select `live_heapdump.hprof`.
2. Select **"Leak Suspects Report"**.
3. Inspect **Dominator Tree** & **Histogram** to detect memory leaks.
