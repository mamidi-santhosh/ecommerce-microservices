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
| **JDK `jcmd`** | Command-line diagnostic & Heap Dump capture | Included in JDK (`jcmd <pid> GC.heap_dump`) |
| **JDK `jstat`** | Real-time GC stats & heap pool usage | Included in JDK (`jstat -gcutil <pid> 1000`) |
| **VisualVM / JProfiler** | Live visual monitoring of heap graphs | GUI Desktop Tool |
| **Eclipse MAT** | Deep Memory Leak Analysis (`.hprof` dumps) | Desktop Analysis App |
| **k6 / JMeter** | High-concurrency load generation | CLI / GUI Load Generator |

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

* `-Xms256m`: Initial Heap Size (256 MB)
* `-Xmx512m`: Maximum Allowed Heap Size (512 MB)
* `-XX:+HeapDumpOnOutOfMemoryError`: Automatically generates `.hprof` file if Java runs out of memory!

---

## 🧪 4. Step-by-Step Heap Memory Testing Protocol

### STEP 1: Find Application Process ID (PID)
```bash
jcmd -l
# Output: 40464 com.ecommerce.auth.AuthServiceApplication
```

### STEP 2: Record Baseline Idle Memory
Query Spring Boot Actuator or `jstat`:
```bash
# Actuator metric
curl http://localhost:8080/actuator/metrics/jvm.memory.used

# jstat GC Monitoring (sample every 1 second)
jstat -gcutil <PID> 1000
```
* **Output columns**:
  * `E`: Eden space usage (%)
  * `O`: Old generation usage (%)
  * `M`: Metaspace usage (%)
  * `YGC`: Young GC count
  * `FGC`: Full GC count (Should be close to 0!)

### STEP 3: Execute Sustained Concurrent Load Test (k6 Script)
Run a 10-minute load test simulating 200 concurrent users performing high-volume transactions:

```javascript
// load_test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 },  // Ramp up to 50 users
    { duration: '5m', target: 200 }, // Sustained stress at 200 users
    { duration: '1m', target: 0 },   // Ramp down
  ],
};

export default function () {
  const res = http.get('http://localhost:8080/api/products');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(0.1);
}
```
Run command: `k6 run load_test.js`

### STEP 4: Trigger Live Heap Dump Capture
While under load or immediately after load stops, capture a Heap Dump:

* **Method A (JDK `jcmd`)**:
  ```bash
  jcmd <PID> GC.heap_dump C:/dumps/app_heap_load.hprof
  ```

* **Method B (Spring Boot Actuator)**:
  ```bash
  curl -G http://localhost:8080/actuator/heapdump -o heapdump.hprof
  ```

---

## 🔍 5. Heap Dump Analysis in Eclipse MAT

1. Open **Eclipse Memory Analyzer (MAT)** ➔ File ➔ Open Heap Dump ➔ Select `heapdump.hprof`.
2. Select **"Leak Suspects Report"**.
3. **Key Views to Inspect**:
   * **Dominator Tree**: Displays objects consuming the largest percentage of Heap Memory.
   * **Histogram**: Displays object class counts (e.g. 500,000 instances of `byte[]` or `java.util.HashMap$Node`).
   * **GC Roots**: Trace paths keeping unreferenced objects alive in memory.

---

## 🚩 6. Common Spring Boot Memory Leaks & Fixes

1. **Unbounded Caches (`HashMap` / `ArrayList`)**:
   * *Symptom*: OldGen (`O` column in `jstat`) steadily increases to 100% and never drops after GC.
   * *Fix*: Replace custom static maps with **Caffeine Cache** / **Redis TTL** with explicit max size limits (`maximumSize(10000)`).

2. **Unclosed DB ResultSets / Streams / HTTP Connections**:
   * *Symptom*: Thousands of `HikariProxyConnection` or `Netty` connection buffers taking up heap.
   * *Fix*: Always use try-with-resources (`try (Connection conn = ...)`) or Spring Data JPA repositories.

3. **ThreadLocal Variable Leaks in Tomcat Worker Threads**:
   * *Symptom*: User session data persists across requests on Tomcat thread pool.
   * *Fix*: Always invoke `ThreadLocal.remove()` inside a `finally` block or Servlet Filter `afterCompletion()`.
