package com.furkankozmac.takttwin.infrastructure.persistence.bootstrap;

import com.furkankozmac.takttwin.core.application.port.ProductionOrderPort;
import com.furkankozmac.takttwin.core.domain.model.OrderStatus;
import com.furkankozmac.takttwin.core.domain.model.ProductionOrder;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@Order(2)
public class ProductionOrderSeeder implements CommandLineRunner {

    private final ProductionOrderPort productionOrderPort;

    public ProductionOrderSeeder(ProductionOrderPort productionOrderPort) {
        this.productionOrderPort = productionOrderPort;
    }

    @Override
    public void run(String... args) throws Exception {
        if (productionOrderPort.findAll().isEmpty()) {
            ProductionOrder defaultOrder = ProductionOrder.builder()
                    .orderNumber("PO-2026-001")
                    .productModel("Corolla Hybrid")
                    .targetQuantity(30)
                    .completedQuantity(0)
                    .status(OrderStatus.PENDING)
                    .createdAt(LocalDateTime.now())
                    .build();
            productionOrderPort.save(defaultOrder);
            System.out.println("[SEEDER] Seeded default Production Order PO-2026-001 (PENDING)");
        }
    }
}
