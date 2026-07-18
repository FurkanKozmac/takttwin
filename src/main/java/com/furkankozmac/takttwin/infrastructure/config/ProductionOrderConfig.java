package com.furkankozmac.takttwin.infrastructure.config;

import com.furkankozmac.takttwin.core.application.port.ProductionOrderPort;
import com.furkankozmac.takttwin.core.application.service.ProductionOrderService;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ProductionOrderConfig {

    @Bean
    public ProductionOrderService productionOrderService(ProductionOrderPort productionOrderPort, ApplicationEventPublisher eventPublisher) {
        return new ProductionOrderService(productionOrderPort, eventPublisher);
    }
}
