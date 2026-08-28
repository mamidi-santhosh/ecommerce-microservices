package com.ecommerce.payment.dto;

import java.math.BigDecimal;

public class PaymentResponse {
    private boolean success;
    private String transactionId;
    private String orderId;
    private BigDecimal amount;
    private String message;
    private String status;

    public PaymentResponse() {}

    public PaymentResponse(boolean success, String transactionId, String orderId, BigDecimal amount, String message, String status) {
        this.success = success;
        this.transactionId = transactionId;
        this.orderId = orderId;
        this.amount = amount;
        this.message = message;
        this.status = status;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
