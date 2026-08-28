package com.ecommerce.order.event;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class OrderEvent implements Serializable {

    private String orderId;
    private String customerEmail;
    private String sku;
    private int quantity;
    private BigDecimal amount;
    private String status;
    private String message;
    private LocalDateTime timestamp;

    public OrderEvent() {
    }

    public OrderEvent(String orderId, String customerEmail, String sku, int quantity, BigDecimal amount, String status, String message, LocalDateTime timestamp) {
        this.orderId = orderId;
        this.customerEmail = customerEmail;
        this.sku = sku;
        this.quantity = quantity;
        this.amount = amount;
        this.status = status;
        this.message = message;
        this.timestamp = timestamp;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
