---
name: springboot-heap-memory-testing
description: Complete step-by-step guide and template for conducting JVM Heap Memory Testing, Leak Detection, Load Profiling, and Heap Dump Analysis on any Spring Boot application deployed on embedded or standalone Tomcat using an attached Postman Collection.
---

# 🧠 Spring Boot JVM Heap Memory Testing & Profiling Skill

This skill provides an end-to-end framework for performance testing, heap profiling, memory leak detection, and Heap Dump analysis for any Spring Boot Java application running on Tomcat. All load test transactions are dynamically driven from an attached **Postman Collection JSON file**.

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
| **Newman CLI (Postman Engine)** | Dynamically execute attached Postman Collections under load | `newman run <collection.json> -n <iterations>` |
| **Postman GUI** | Built-in Performance tab for Virtual User load testing | Postman Desktop Runner |
| **JDK `jcmd`** | Command-line diagnostic & Heap Dump capture | Included in JDK (`jcmd <pid> GC.heap_dump`) |
| **JDK `jstat`** | Real-time GC stats & heap pool usage | Included in JDK (`jstat -gcutil <pid> 1000`) |
| **Eclipse MAT** | Deep Memory Leak Analysis (`.hprof` dumps) | Desktop Analysis App |

---

## ⚙️ 3. JVM Startup Flags Setup (Mandatory)

Configure your Spring Boot container with explicit memory boundaries and automated dump capture on Out-Of-Memory (`OOM`):

```bash
java -Xms256m -Xmx512m \
     -XX:+UseG1GC \
     -XX:+HeapDumpOnOutOfMemoryError \
     -XX:HeapDumpPath=./heap_oom.hprof \
     -jar app.jar
```

---

## 🧪 4. Dynamic Postman-Driven Heap Memory Testing Protocol

### STEP 1: Find Application Process ID (PID)
```bash
jcmd -l
```

### STEP 2: Record Baseline Idle Memory & Start GC Monitoring
```bash
# Monitor GC activity (sample every 1 second)
jstat -gcutil <PID> 1000
```

---

### STEP 3: Execute Load Test via Attached Postman Collection (Zero Hardcoded APIs)

The agent or user must locate the Postman Collection JSON file in the project repository (e.g. `*.json`) and execute the load test dynamically:

#### 🏆 Method A: Using Newman CLI (Postman Automated CLI Engine)
Run the attached Postman Collection for `N` iterations across all defined request flows:

1. Install Newman (if not installed):
   ```bash
   npm install -g newman
   ```
2. Execute the Postman Collection file dynamically:
   ```bash
   newman run <PATH_TO_POSTMAN_COLLECTION.json> -n 500
   ```
   *(This dynamically executes all API endpoints, auth tokens, headers, and request bodies defined in the Postman Collection without hardcoding any endpoints!)*

---

#### ⚡ Method B: Using Postman GUI Performance Tab
1. Open **Postman Desktop**.
2. Drag and drop or open the **Postman Collection JSON**.
3. Click **Run Collection** ➔ Select **Performance Tab**.
4. Set **Virtual Users** (e.g. `50`) and **Duration** (e.g. `5 minutes`).
5. Click **Run** to execute all collection APIs under load.

---

### STEP 4: Trigger Live Heap Dump Capture
While the Postman collection load test is running (or immediately after completion), capture the Heap Dump:

* **Using JDK `jcmd`**:
  ```bash
  jcmd <PID> GC.heap_dump ./live_heapdump.hprof
  ```

* **OR via Spring Boot Actuator**:
  ```bash
  curl -G http://<HOST>:<PORT>/actuator/heapdump -o ./live_heapdump.hprof
  ```

---

## 🔍 5. Heap Dump Analysis in Eclipse MAT

1. Open **Eclipse MAT** ➔ File ➔ Open Heap Dump ➔ Select `live_heapdump.hprof`.
2. Select **"Leak Suspects Report"**.
3. Inspect **Dominator Tree** & **Histogram** to detect memory leaks.
