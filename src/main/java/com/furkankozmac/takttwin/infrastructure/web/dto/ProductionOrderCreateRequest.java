package com.furkankozmac.takttwin.infrastructure.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductionOrderCreateRequest {

    @NotBlank(message = "Order number cannot be blank")
    private String orderNumber;

    @NotBlank(message = "Product model cannot be blank")
    private String productModel;

    @NotNull(message = "Target quantity cannot be null")
    @Positive(message = "Target quantity must be greater than zero")
    private Integer targetQuantity;
}
