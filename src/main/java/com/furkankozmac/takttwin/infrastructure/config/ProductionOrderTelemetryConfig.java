package com.furkankozmac.takttwin.infrastructure.config;

import com.furkankozmac.takttwin.core.application.port.*;
import com.furkankozmac.takttwin.core.application.service.ProductionOrderTelemetryService;
import com.furkankozmac.takttwin.core.application.service.TelemetryService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class ProductionOrderTelemetryConfig {

    @Bean("productionOrderTelemetryService")
    @Primary
    public TelemetryService telemetryService(TelemetryLogPort telemetryLogPort,
                                             StationPort stationPort,
                                             WorkElementPort workElementPort,
                                             AndonAlertPort andonAlertPort,
                                             ProductionOrderPort productionOrderPort) {
        return new ProductionOrderTelemetryService(
                telemetryLogPort, stationPort, workElementPort, andonAlertPort, productionOrderPort
        );
    }
}
