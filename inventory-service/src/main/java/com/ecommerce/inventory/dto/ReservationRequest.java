package com.ecommerce.inventory.dto;

public class ReservationRequest {
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
