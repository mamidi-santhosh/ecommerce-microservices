---
name: springboot-heap-memory-testing
description: Complete step-by-step guide and template for conducting JVM Heap Memory Testing, Leak Detection, Load Profiling, and Heap Dump Analysis on any Spring Boot WAR application deployed on standalone Apache Tomcat or embedded Tomcat using an attached Postman Collection.
---

# 🧠 Spring Boot WAR JVM Heap Memory Testing & Profiling Skill

This skill provides a streamlined 5-step framework for JVM heap memory testing, load profiling, heap dump capture, and automated memory leak analysis for any Spring Boot **WAR (`.war`)** application running on Apache Tomcat (or Smart Tomcat in IntelliJ). All load test transactions are dynamically driven from an attached **Postman Collection JSON file** via **Newman CLI**.

---

## 📐 1. JVM Memory Architecture Overview

JVM Heap memory is divided into distinct pools managed by Garbage Collectors (e.g., G1GC):

* **Young Generation (YoungGen)**:
  * **Eden Space (`E`)**: New object allocations (`new User()`).
  * **Survivor Spaces (`S0`/`S1`)**: Objects that survived minor GC.
* **Old Generation (`O`)**: Long-lived objects promoted from YoungGen after reaching aging threshold (e.g., Spring Singletons, Session caches).
* **Metaspace (`M`)**: Native memory holding class definitions, bytecode, and method data.

---

## 🛠️ 2. Recommended Toolchain (Lean & Efficient)

| Component | Tool Choice | Purpose / Command |
| :--- | :--- | :--- |
| **JVM Memory Config** | `setenv.bat` / Smart Tomcat | Set `-Xms256m -Xmx512m -XX:+HeapDumpOnOutOfMemoryError` |
| **Load Testing** | **Newman CLI** | Run Postman Collection: `newman run <collection.json> -n 500` |
| **Process Discovery** | **JDK `jcmd`** | Discover Tomcat Java PID: `jcmd -l` |
| **GC Monitoring** | **JDK `jstat`** | Real-time GC stats: `jstat -gcutil <PID> 1000` |
| **Heap Dump Capture**| **JDK `jcmd`** | Capture `.hprof` snapshot: `jcmd <PID> GC.heap_dump ./tomcat_heap.hprof` |
| **Heap Analysis** | **Antigravity AI** | AI Chat analysis of heap metrics & dumps (Zero GUI required) |

---

## ⚙️ 3. Step-by-Step Execution Protocol

### STEP 1: Set JVM Memory Flags (`CATALINA_OPTS`)
Configure Tomcat memory limits and auto-dump on Out-Of-Memory (`OOM`):

* **Windows Standalone Tomcat (`apache-tomcat/bin/setenv.bat`)**:
  ```cmd
  set CATALINA_OPTS=-Xms256m -Xmx512m -XX:+UseG1GC -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=C:\logs\tomcat_heap_oom.hprof
  ```

* **IntelliJ Smart Tomcat Plugin**:
  Add to **VM options** text box in Run Configuration:
  ```text
  -Xms256m -Xmx512m -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=./tomcat_heap_oom.hprof
  ```

---

### STEP 2: Find Tomcat Process ID (PID) & Start GC Monitoring
Open terminal and discover running Tomcat Java PID:

1. **Find PID**:
   ```bash
   jcmd -l
   # Example output: 40464 org.apache.catalina.startup.Bootstrap
   ```

2. **Start Garbage Collection Monitoring**:
   ```bash
   jstat -gcutil <PID> 1000
   ```
   * **Key Columns**:
     * `E`: Eden space usage (%)
     * `O`: Old Generation usage (%) — *If `O` stays near 100% after GC, a memory leak exists!*
     * `FGC`: Full GC count — *Should remain low during load.*

---

### STEP 3: Execute Load Test via Newman CLI (Postman Collection)
Run the attached Postman Collection JSON dynamically across all API endpoints in a high-concurrency loop:

1. Install Newman (if not installed):
   ```bash
   npm install -g newman
   ```

2. Execute Postman Collection for 500 iterations:
   ```bash
   newman run <PATH_TO_POSTMAN_COLLECTION.json> -n 500
   ```
   *(This dynamically executes login, tokens, product queries, and checkout flows defined in your Postman collection with zero hardcoded API URLs!)*

---

### STEP 4: Capture Live Heap Dump Snapshot (`.hprof`)
While Newman is running (or immediately after load completes), capture a binary Heap Dump:

```bash
jcmd <PID> GC.heap_dump ./tomcat_heapdump.hprof
```

---

### STEP 5: Automated Memory Analysis via Antigravity AI
You do **not** need to install external GUI tools like Eclipse MAT. Simply prompt Antigravity AI in chat:

> *"I have captured `tomcat_heapdump.hprof` for my Tomcat WAR application. Use the `springboot-heap-memory-testing` skill to analyze the heap memory, check `jstat` metrics, and report any memory leaks."*

Antigravity AI will inspect the dump metrics, identify memory-hogging objects, check for thread/connection leaks, and deliver a detailed performance report!
