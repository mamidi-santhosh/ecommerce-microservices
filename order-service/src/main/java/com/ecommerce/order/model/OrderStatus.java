package com.ecommerce.order.model;

public enum OrderStatus {
    PENDING,
    INVENTORY_RESERVED,
    PAYMENT_SUCCESS,
    CONFIRMED,
    CANCELLED_OUT_OF_STOCK,
    CANCELLED_PAYMENT_FAILED,
    CANCELLED_CIRCUIT_OPEN
}
