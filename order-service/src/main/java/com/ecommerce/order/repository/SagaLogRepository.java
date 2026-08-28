package com.ecommerce.order.repository;

import com.ecommerce.order.model.SagaLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SagaLogRepository extends JpaRepository<SagaLog, Long> {
    List<SagaLog> findByOrderIdOrderByIdAsc(String orderId);
}
