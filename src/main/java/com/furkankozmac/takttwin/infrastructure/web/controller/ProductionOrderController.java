package com.furkankozmac.takttwin.infrastructure.web.controller;

import com.furkankozmac.takttwin.core.application.service.OeeService;
import com.furkankozmac.takttwin.core.application.service.ProductionOrderService;
import com.furkankozmac.takttwin.core.domain.model.ProductionOrder;
import com.furkankozmac.takttwin.infrastructure.web.dto.OeeResponseDto;
import com.furkankozmac.takttwin.infrastructure.web.dto.ProductionOrderCreateRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class ProductionOrderController {

    private final ProductionOrderService productionOrderService;
    private final OeeService oeeService;

    public ProductionOrderController(ProductionOrderService productionOrderService, OeeService oeeService) {
        this.productionOrderService = productionOrderService;
        this.oeeService = oeeService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductionOrder> createOrder(@Valid @RequestBody ProductionOrderCreateRequest request) {
        ProductionOrder domain = ProductionOrder.builder()
                .orderNumber(request.getOrderNumber())
                .productModel(request.getProductModel())
                .targetQuantity(request.getTargetQuantity())
                .build();
        
        ProductionOrder created = productionOrderService.createOrder(domain);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}/activate")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_LEADER')")
    public ResponseEntity<ProductionOrder> activateOrder(@PathVariable("id") Long id) {
        ProductionOrder activated = productionOrderService.activateOrder(id);
        return ResponseEntity.ok(activated);
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_LEADER', 'OPERATOR', 'HSE_SPECIALIST')")
    public ResponseEntity<ProductionOrder> getActiveOrder() {
        try {
            ProductionOrder active = productionOrderService.getActiveOrder();
            return ResponseEntity.ok(active);
        } catch (com.furkankozmac.takttwin.core.domain.exception.EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/active/oee")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_LEADER', 'OPERATOR', 'HSE_SPECIALIST')")
    public ResponseEntity<OeeResponseDto> getActiveOrderOee() {
        try {
            return ResponseEntity.ok(oeeService.calculateActiveOrderOee());
        } catch (com.furkankozmac.takttwin.core.domain.exception.EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_LEADER')")
    public ResponseEntity<List<ProductionOrder>> getAllOrders() {
        List<ProductionOrder> orders = productionOrderService.getAllOrders();
        return ResponseEntity.ok(orders);
    }
}
