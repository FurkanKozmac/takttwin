package com.furkankozmac.takttwin.core.application.service;

import com.furkankozmac.takttwin.core.application.port.ProductionOrderPort;
import com.furkankozmac.takttwin.core.domain.exception.EntityNotFoundException;
import com.furkankozmac.takttwin.core.domain.model.OrderStatus;
import com.furkankozmac.takttwin.core.domain.model.ProductionOrder;

import java.time.LocalDateTime;
import java.util.List;

public class ProductionOrderService {

    private final ProductionOrderPort productionOrderPort;

    public ProductionOrderService(ProductionOrderPort productionOrderPort) {
        this.productionOrderPort = productionOrderPort;
    }

    public ProductionOrder createOrder(ProductionOrder order) {
        if (productionOrderPort.existsByOrderNumber(order.getOrderNumber())) {
            throw new IllegalArgumentException("Production Order with order number " + order.getOrderNumber() + " already exists");
        }
        order.setStatus(OrderStatus.PENDING);
        order.setCompletedQuantity(0);
        order.setCreatedAt(LocalDateTime.now());
        return productionOrderPort.save(order);
    }

    public ProductionOrder activateOrder(Long id) {
        ProductionOrder targetOrder = productionOrderPort.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ProductionOrder with id " + id + " not found"));

        // Deactivate any currently active orders
        productionOrderPort.findActiveOrder().ifPresent(activeOrder -> {
            activeOrder.setStatus(OrderStatus.PENDING);
            productionOrderPort.save(activeOrder);
        });

        targetOrder.setStatus(OrderStatus.ACTIVE);
        return productionOrderPort.save(targetOrder);
    }

    public ProductionOrder getActiveOrder() {
        return productionOrderPort.findActiveOrder()
                .orElseThrow(() -> new EntityNotFoundException("No active production order found"));
    }

    public List<ProductionOrder> getAllOrders() {
        return productionOrderPort.findAll();
    }
}
