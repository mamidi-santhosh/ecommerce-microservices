package com.ecommerce.order.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "saga_logs")
public class SagaLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String orderId;
    private String stepName; // CREATE_ORDER, RESERVE_INVENTORY, PROCESS_PAYMENT, COMPENSATE_INVENTORY, CONFIRM_ORDER
    private String status;   // STARTED, COMPLETED, FAILED, COMPENSATED
    private String details;
    private LocalDateTime timestamp;

    public SagaLog() {}

    public SagaLog(Long id, String orderId, String stepName, String status, String details, LocalDateTime timestamp) {
        this.id = id;
        this.orderId = orderId;
        this.stepName = stepName;
        this.status = status;
        this.details = details;
        this.timestamp = timestamp;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public String getStepName() { return stepName; }
    public void setStepName(String stepName) { this.stepName = stepName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
