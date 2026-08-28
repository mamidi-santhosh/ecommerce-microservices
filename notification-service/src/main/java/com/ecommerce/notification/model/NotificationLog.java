package com.ecommerce.notification.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "notification_logs")
public class NotificationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String orderId;
    private String recipientEmail;
    private String message;
    private String channel; // EMAIL, SMS, PUSH
    private LocalDateTime timestamp;

    public NotificationLog() {}

    public NotificationLog(Long id, String orderId, String recipientEmail, String message, String channel, LocalDateTime timestamp) {
        this.id = id;
        this.orderId = orderId;
        this.recipientEmail = recipientEmail;
        this.message = message;
        this.channel = channel;
        this.timestamp = timestamp;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public String getRecipientEmail() { return recipientEmail; }
    public void setRecipientEmail(String recipientEmail) { this.recipientEmail = recipientEmail; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
