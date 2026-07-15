package com.furkankozmac.takttwin.infrastructure.config;

import com.furkankozmac.takttwin.core.application.port.AndonAlertPort;
import com.furkankozmac.takttwin.core.application.port.StationPort;
import com.furkankozmac.takttwin.core.application.port.TelemetryLogPort;
import com.furkankozmac.takttwin.core.application.port.WorkElementPort;
import com.furkankozmac.takttwin.core.application.service.EnglishTelemetryService;
import com.furkankozmac.takttwin.core.application.service.TelemetryService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class EnglishTelemetryConfig {

    @Bean("englishTelemetryService")
    @Primary
    public TelemetryService englishTelemetryService(TelemetryLogPort telemetryLogPort,
                                                    StationPort stationPort,
                                                    WorkElementPort workElementPort,
                                                    AndonAlertPort andonAlertPort) {
        return new EnglishTelemetryService(telemetryLogPort, stationPort, workElementPort, andonAlertPort);
    }
}
