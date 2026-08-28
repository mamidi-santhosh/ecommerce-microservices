package com.ecommerce.order.dto;

import java.math.BigDecimal;

public class OrderRequest {
    private String customerEmail;
    private String sku;
    private Integer quantity;
    private BigDecimal amount;
    private String paymentMethod;
    private boolean simulatePaymentFailure;

    public OrderRequest() {}

    public OrderRequest(String customerEmail, String sku, Integer quantity, BigDecimal amount, String paymentMethod, boolean simulatePaymentFailure) {
        this.customerEmail = customerEmail;
        this.sku = sku;
        this.quantity = quantity;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.simulatePaymentFailure = simulatePaymentFailure;
    }

    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public boolean isSimulatePaymentFailure() { return simulatePaymentFailure; }
    public void setSimulatePaymentFailure(boolean simulatePaymentFailure) { this.simulatePaymentFailure = simulatePaymentFailure; }
}
