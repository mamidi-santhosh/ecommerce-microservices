package com.ecommerce.order.client;

import com.ecommerce.order.dto.ClientDTOs.InventoryResponse;
import com.ecommerce.order.dto.ClientDTOs.ReservationRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "inventory-service")
public interface InventoryClient {

    @PostMapping("/api/inventory/reserve")
    InventoryResponse reserveStock(@RequestBody ReservationRequest request);

    @PostMapping("/api/inventory/release")
    InventoryResponse releaseStock(@RequestBody ReservationRequest request);
}
