package com.ecommerce.notification.dto;

public class NotificationRequest {
    private String orderId;
    private String recipientEmail;
    private String message;
    private String channel;

    public NotificationRequest() {}

    public NotificationRequest(String orderId, String recipientEmail, String message, String channel) {
        this.orderId = orderId;
        this.recipientEmail = recipientEmail;
        this.message = message;
        this.channel = channel;
    }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public String getRecipientEmail() { return recipientEmail; }
    public void setRecipientEmail(String recipientEmail) { this.recipientEmail = recipientEmail; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }
}
