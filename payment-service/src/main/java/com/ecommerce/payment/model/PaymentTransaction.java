package com.ecommerce.payment.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_transactions")
public class PaymentTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String transactionId;
    private String orderId;
    private BigDecimal amount;
    private String status; // SUCCESS, FAILED, REFUNDED
    private String paymentMethod;
    private LocalDateTime timestamp;

    public PaymentTransaction() {}

    public PaymentTransaction(Long id, String transactionId, String orderId, BigDecimal amount, String status, String paymentMethod, LocalDateTime timestamp) {
        this.id = id;
        this.transactionId = transactionId;
        this.orderId = orderId;
        this.amount = amount;
        this.status = status;
        this.paymentMethod = paymentMethod;
        this.timestamp = timestamp;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
