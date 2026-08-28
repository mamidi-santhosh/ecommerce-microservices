package com.ecommerce.payment.dto;

import java.math.BigDecimal;

public class PaymentRequest {
    private String orderId;
    private BigDecimal amount;
    private String paymentMethod; // CREDIT_CARD, UPI, PAYPAL
    private boolean simulateFailure; // For testing Saga compensation & Circuit Breaker

    public PaymentRequest() {}

    public PaymentRequest(String orderId, BigDecimal amount, String paymentMethod, boolean simulateFailure) {
        this.orderId = orderId;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.simulateFailure = simulateFailure;
    }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public boolean isSimulateFailure() { return simulateFailure; }
    public void setSimulateFailure(boolean simulateFailure) { this.simulateFailure = simulateFailure; }
}
