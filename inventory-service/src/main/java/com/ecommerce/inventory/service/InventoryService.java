package com.ecommerce.inventory.service;

import com.ecommerce.inventory.dto.InventoryResponse;
import com.ecommerce.inventory.dto.ReservationRequest;
import com.ecommerce.inventory.model.Product;
import com.ecommerce.inventory.repository.ProductRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class InventoryService {

    private final ProductRepository productRepository;

    public InventoryService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @PostConstruct
    public void seedInitialProducts() {
        if (productRepository.count() == 0) {
            productRepository.saveAll(List.of(
                new Product(null, "PROD-NEO-01", "Cyberpunk Wireless Headphones", "Active noise cancelling with RGB ambient light spectrum", new BigDecimal("199.99"), 50, "Electronics", "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80"),
                new Product(null, "PROD-NEO-02", "Quantum Mechanical Keyboard", "Linear optical switches with magnetic wrist rest", new BigDecimal("149.50"), 30, "Accessories", "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80"),
                new Product(null, "PROD-NEO-03", "Aura OLED Smartwatch 5", "Biometric tracking, Sapphire glass, 7-day battery life", new BigDecimal("299.00"), 20, "Wearables", "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80"),
                new Product(null, "PROD-NEO-04", "Holographic Drone X4", "4K HDR camera, obstacle avoidance, follow-me tracking", new BigDecimal("499.99"), 15, "Gadgets", "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=500&q=80")
            ));
        }
    }

    @Cacheable(value = "products")
    public List<Product> getAllProducts() {
        System.out.println(">>> [CACHE MISS - @Cacheable] Fetching products directly from MySQL DB!");
        return productRepository.findAll();
    }

    @Cacheable(value = "product-sku", key = "#sku")
    public Optional<Product> getProductBySku(String sku) {
        System.out.println(">>> [CACHE MISS - @Cacheable] Fetching SKU " + sku + " from DB");
        return productRepository.findBySku(sku);
    }

    @Transactional
    @CacheEvict(value = {"products", "product-sku"}, allEntries = true)
    public InventoryResponse reserveStock(ReservationRequest request) {
        Optional<Product> optionalProduct = productRepository.findBySku(request.getSku());
        if (optionalProduct.isEmpty()) {
            return new InventoryResponse(false, "Product SKU not found: " + request.getSku(), request.getOrderId(), request.getSku(), 0);
        }

        Product product = optionalProduct.get();
        if (product.getStockQuantity() < request.getQuantity()) {
            return new InventoryResponse(false, "Insufficient stock! Available: " + product.getStockQuantity() + ", Requested: " + request.getQuantity(), request.getOrderId(), request.getSku(), product.getStockQuantity());
        }

        product.setStockQuantity(product.getStockQuantity() - request.getQuantity());
        productRepository.save(product);
        System.out.println(">>> [SPRING @Transactional] Reserved " + request.getQuantity() + " units for SKU: " + request.getSku());

        return new InventoryResponse(true, "Stock successfully reserved", request.getOrderId(), request.getSku(), product.getStockQuantity());
    }

    @Transactional
    @CacheEvict(value = {"products", "product-sku"}, allEntries = true)
    public InventoryResponse releaseStock(ReservationRequest request) {
        Optional<Product> optionalProduct = productRepository.findBySku(request.getSku());
        if (optionalProduct.isPresent()) {
            Product product = optionalProduct.get();
            product.setStockQuantity(product.getStockQuantity() + request.getQuantity());
            productRepository.save(product);
            System.out.println(">>> [SAGA COMPENSATION - @Transactional] Released/Restored " + request.getQuantity() + " units back for SKU: " + request.getSku());
            return new InventoryResponse(true, "Stock compensation executed - stock released", request.getOrderId(), request.getSku(), product.getStockQuantity());
        }
        return new InventoryResponse(false, "Product SKU not found for compensation", request.getOrderId(), request.getSku(), 0);
    }
}
