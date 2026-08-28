# 📘 LESSON 5: RESILIENCE4J CIRCUIT BREAKER & FALLBACKS

> **Goal**: Understand fault tolerance, failure isolation, Circuit Breaker states (`CLOSED`, `OPEN`, `HALF_OPEN`), and fallback methods.

---

## 🏬 ELI10 ANALOGY: THE AUTOMATIC ELECTRICAL FUSE
If an electrical socket starts sparking in a house, the **circuit fuse trips open** immediately to stop electricity and prevent a house fire!
Instead of waiting 30 seconds for a broken payment terminal to timeout, the Circuit Breaker "trips open" and returns a fast safety response instantly!

---

## ⚙️ CIRCUIT BREAKER CODE IMPLEMENTATION

### 1. `application.yml` (Order Service Resilience4j Settings)
```yaml
resilience4j:
  circuitbreaker:
    instances:
      paymentServiceCircuitBreaker:
        slidingWindowSize: 10
        failureRateThreshold: 50
        waitDurationInOpenState: 10000ms
        permittedNumberOfCallsInHalfOpenState: 3
```

---

### 2. `SagaOrchestrator.java` (Circuit Breaker Annotation & Fallback)
```java
@CircuitBreaker(name = "paymentServiceCircuitBreaker", fallbackMethod = "paymentCircuitBreakerFallback")
public PaymentResponse executePaymentWithCircuitBreaker(String orderId, OrderRequest request) {
    return paymentClient.processPayment(new PaymentRequest(
            orderId, request.getAmount(), request.getPaymentMethod(), request.isSimulatePaymentFailure()
    ));
}

public PaymentResponse paymentCircuitBreakerFallback(String orderId, OrderRequest request, Throwable throwable) {
    System.err.println(">>> [RESILIENCE4J FALLBACK] Payment Service Call Intercepted! Reason: " + throwable.getMessage());
    return new PaymentResponse(
            false, null, orderId, request.getAmount(),
            "Payment Service Circuit Breaker OPEN! Call intercepted: " + throwable.getMessage(),
            "CIRCUIT_OPEN"
    );
}
```

---

## 🎯 INTERVIEW QUESTIONS & ANSWERS

### Q1: What are the three states of a Resilience4j Circuit Breaker?
> **Answer**:
> 1. **CLOSED**: Normal state. All requests pass through to the downstream service.
> 2. **OPEN**: Downstream service is failing above threshold (>50%). Requests trip immediately to fallback method without network waiting.
> 3. **HALF_OPEN**: After `waitDurationInOpenState` (e.g. 10s), the circuit allows a limited trial batch of requests to test if the downstream service has recovered.

---
*End of Lesson 5: Resilience4j Circuit Breaker & Fallbacks*
