package com.ecommerce.order.dto;

import com.ecommerce.order.model.OrderStatus;
import com.ecommerce.order.model.SagaLog;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class OrderResponse {
    private String orderId;
    private String customerEmail;
    private String sku;
    private Integer quantity;
    private BigDecimal totalAmount;
    private OrderStatus status;
    private String failureReason;
    private LocalDateTime createdAt;
    private List<SagaLog> sagaAuditLogs;

    public OrderResponse() {}

    public OrderResponse(String orderId, String customerEmail, String sku, Integer quantity, BigDecimal totalAmount, OrderStatus status, String failureReason, LocalDateTime createdAt, List<SagaLog> sagaAuditLogs) {
        this.orderId = orderId;
        this.customerEmail = customerEmail;
        this.sku = sku;
        this.quantity = quantity;
        this.totalAmount = totalAmount;
        this.status = status;
        this.failureReason = failureReason;
        this.createdAt = createdAt;
        this.sagaAuditLogs = sagaAuditLogs;
    }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }

    public String getFailureReason() { return failureReason; }
    public void setFailureReason(String failureReason) { this.failureReason = failureReason; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public List<SagaLog> getSagaAuditLogs() { return sagaAuditLogs; }
    public void setSagaAuditLogs(List<SagaLog> sagaAuditLogs) { this.sagaAuditLogs = sagaAuditLogs; }
}
