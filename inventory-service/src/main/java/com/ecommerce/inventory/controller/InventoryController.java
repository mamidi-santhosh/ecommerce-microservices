package com.ecommerce.inventory.controller;

import com.ecommerce.inventory.dto.InventoryResponse;
import com.ecommerce.inventory.dto.ReservationRequest;
import com.ecommerce.inventory.model.Product;
import com.ecommerce.inventory.service.InventoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping("/api/products")
    public ResponseEntity<List<Product>> getAllProducts() {
        return ResponseEntity.ok(inventoryService.getAllProducts());
    }

    @GetMapping("/api/products/{sku}")
    public ResponseEntity<Product> getProductBySku(@PathVariable String sku) {
        return inventoryService.getProductBySku(sku)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/api/inventory/reserve")
    public ResponseEntity<InventoryResponse> reserveStock(@RequestBody ReservationRequest request) {
        InventoryResponse response = inventoryService.reserveStock(request);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(response);
    }

    @PostMapping("/api/inventory/release")
    public ResponseEntity<InventoryResponse> releaseStock(@RequestBody ReservationRequest request) {
        InventoryResponse response = inventoryService.releaseStock(request);
        return ResponseEntity.ok(response);
    }
}
