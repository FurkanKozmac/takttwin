package com.furkankozmac.takttwin.core.application.event;

import com.furkankozmac.takttwin.core.domain.model.ProductionOrder;

public class OrderEvent {
    private final ProductionOrder productionOrder;

    public OrderEvent(ProductionOrder productionOrder) {
        this.productionOrder = productionOrder;
    }

    public ProductionOrder getProductionOrder() {
        return productionOrder;
    }
}
