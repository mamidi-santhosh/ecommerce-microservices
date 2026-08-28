package com.ecommerce.order.dto;

import java.math.BigDecimal;

public class ClientDTOs {

    public static class ReservationRequest {
        private String orderId;
        private String sku;
        private Integer quantity;

        public ReservationRequest() {}
        public ReservationRequest(String orderId, String sku, Integer quantity) {
            this.orderId = orderId;
            this.sku = sku;
            this.quantity = quantity;
        }

        public String getOrderId() { return orderId; }
        public void setOrderId(String orderId) { this.orderId = orderId; }
        public String getSku() { return sku; }
        public void setSku(String sku) { this.sku = sku; }
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
    }

    public static class InventoryResponse {
        private boolean success;
        private String message;
        private String orderId;
        private String sku;
        private Integer remainingStock;

        public InventoryResponse() {}
        public InventoryResponse(boolean success, String message, String orderId, String sku, Integer remainingStock) {
            this.success = success;
            this.message = message;
            this.orderId = orderId;
            this.sku = sku;
            this.remainingStock = remainingStock;
        }

        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public String getOrderId() { return orderId; }
        public void setOrderId(String orderId) { this.orderId = orderId; }
        public String getSku() { return sku; }
        public void setSku(String sku) { this.sku = sku; }
        public Integer getRemainingStock() { return remainingStock; }
        public void setRemainingStock(Integer remainingStock) { this.remainingStock = remainingStock; }
    }

    public static class PaymentRequest {
        private String orderId;
        private BigDecimal amount;
        private String paymentMethod;
        private boolean simulateFailure;

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

    public static class PaymentResponse {
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

    public static class NotificationRequest {
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
}
