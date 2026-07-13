package com.furkankozmac.takttwin.infrastructure.config;

import com.furkankozmac.takttwin.core.application.port.AndonAlertPort;
import com.furkankozmac.takttwin.core.application.port.StationPort;
import com.furkankozmac.takttwin.core.application.port.TelemetryLogPort;
import com.furkankozmac.takttwin.core.application.port.WorkElementPort;
import com.furkankozmac.takttwin.core.application.service.StationService;
import com.furkankozmac.takttwin.core.application.service.TelemetryService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ApplicationConfig {

    @Bean
    public StationService stationService(StationPort stationPort, WorkElementPort workElementPort) {
        return new StationService(stationPort, workElementPort);
    }

    @Bean
    public TelemetryService telemetryService(TelemetryLogPort telemetryLogPort, StationPort stationPort, WorkElementPort workElementPort, AndonAlertPort andonAlertPort) {
        return new TelemetryService(telemetryLogPort, stationPort, workElementPort, andonAlertPort);
    }
}
