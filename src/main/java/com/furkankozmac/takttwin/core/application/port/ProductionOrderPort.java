package com.furkankozmac.takttwin.core.application.port;

import com.furkankozmac.takttwin.core.domain.model.ProductionOrder;

import java.util.List;
import java.util.Optional;

public interface ProductionOrderPort {
    ProductionOrder save(ProductionOrder order);
    Optional<ProductionOrder> findById(Long id);
    Optional<ProductionOrder> findActiveOrder();
    List<ProductionOrder> findAll();
    boolean existsByOrderNumber(String orderNumber);
    void incrementCompletedQuantity(Long orderId);
}
