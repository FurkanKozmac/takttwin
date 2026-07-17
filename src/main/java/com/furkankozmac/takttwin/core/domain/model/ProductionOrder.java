package com.furkankozmac.takttwin.core.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductionOrder {
    private Long id;
    private String orderNumber;
    private String productModel;
    private Integer targetQuantity;
    private Integer completedQuantity;
    private OrderStatus status;
    private LocalDateTime createdAt;
}
