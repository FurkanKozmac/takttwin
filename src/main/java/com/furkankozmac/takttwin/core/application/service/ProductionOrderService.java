package com.furkankozmac.takttwin.core.application.service;

import com.furkankozmac.takttwin.core.application.event.OrderEvent;
import com.furkankozmac.takttwin.core.application.port.ProductionOrderPort;
import com.furkankozmac.takttwin.core.domain.exception.EntityNotFoundException;
import com.furkankozmac.takttwin.core.domain.model.OrderStatus;
import com.furkankozmac.takttwin.core.domain.model.ProductionOrder;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDateTime;
import java.util.List;

public class ProductionOrderService {

    private final ProductionOrderPort productionOrderPort;
    private final ApplicationEventPublisher eventPublisher;

    public ProductionOrderService(ProductionOrderPort productionOrderPort, ApplicationEventPublisher eventPublisher) {
        this.productionOrderPort = productionOrderPort;
        this.eventPublisher = eventPublisher;
    }

    public ProductionOrder createOrder(ProductionOrder order) {
        if (productionOrderPort.existsByOrderNumber(order.getOrderNumber())) {
            throw new IllegalArgumentException("Production Order with order number " + order.getOrderNumber() + " already exists");
        }
        order.setStatus(OrderStatus.PENDING);
        order.setCompletedQuantity(0);
        order.setCreatedAt(LocalDateTime.now());
        ProductionOrder savedOrder = productionOrderPort.save(order);
        eventPublisher.publishEvent(new OrderEvent(savedOrder));
        return savedOrder;
    }

    public ProductionOrder activateOrder(Long id) {
        ProductionOrder targetOrder = productionOrderPort.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ProductionOrder with id " + id + " not found"));

        // Deactivate any currently active orders
        productionOrderPort.findActiveOrder().ifPresent(activeOrder -> {
            activeOrder.setStatus(OrderStatus.PENDING);
            ProductionOrder savedActive = productionOrderPort.save(activeOrder);
            eventPublisher.publishEvent(new OrderEvent(savedActive));
        });

        targetOrder.setStatus(OrderStatus.ACTIVE);
        ProductionOrder savedTarget = productionOrderPort.save(targetOrder);
        eventPublisher.publishEvent(new OrderEvent(savedTarget));
        return savedTarget;
    }

    public ProductionOrder getActiveOrder() {
        return productionOrderPort.findActiveOrder()
                .orElseThrow(() -> new EntityNotFoundException("No active production order found"));
    }

    public List<ProductionOrder> getAllOrders() {
        return productionOrderPort.findAll();
    }
}
