package com.ecommerce.inventory.dto;

public class InventoryResponse {
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
