package com.furkankozmac.takttwin.infrastructure.persistence.mapper;

import com.furkankozmac.takttwin.core.domain.model.ProductionOrder;
import com.furkankozmac.takttwin.infrastructure.persistence.entity.ProductionOrderEntity;

public class ProductionOrderMapper {

    public static ProductionOrder toDomain(ProductionOrderEntity entity) {
        if (entity == null) return null;
        return ProductionOrder.builder()
                .id(entity.getId())
                .orderNumber(entity.getOrderNumber())
                .productModel(entity.getProductModel())
                .targetQuantity(entity.getTargetQuantity())
                .completedQuantity(entity.getCompletedQuantity())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    public static ProductionOrderEntity toEntity(ProductionOrder domain) {
        if (domain == null) return null;
        return ProductionOrderEntity.builder()
                .id(domain.getId())
                .orderNumber(domain.getOrderNumber())
                .productModel(domain.getProductModel())
                .targetQuantity(domain.getTargetQuantity())
                .completedQuantity(domain.getCompletedQuantity())
                .status(domain.getStatus())
                .createdAt(domain.getCreatedAt())
                .build();
    }
}
