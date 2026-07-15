package com.furkankozmac.takttwin.infrastructure.config;

import com.furkankozmac.takttwin.core.application.port.*;
import com.furkankozmac.takttwin.core.application.service.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

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

    @Bean
    public YamazumiService yamazumiService(StationPort stationPort,
                                           WorkElementPort workElementPort,
                                           TelemetryLogPort telemetryLogPort) {
        return new YamazumiService(stationPort, workElementPort, telemetryLogPort);
    }

    @Bean
    public AuthService authService(UserPort userPort, RefreshTokenPort refreshTokenPort, PasswordPort passwordPort) {
        return new AuthService(userPort, refreshTokenPort, passwordPort);
    }

    @Bean
    public AndonAlertService andonAlertService(AndonAlertPort andonAlertPort) {
        return new AndonAlertService(andonAlertPort);
    }

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**") // Projedeki tüm endpoint'lere uygula
                        .allowedOrigins("*") // Geliştirme aşamasında tüm kökenlerden (origins) gelen isteklere izin ver
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS") // İzin verilen HTTP metotları
                        .allowedHeaders("*"); // Tüm HTTP başlıklarına (headers) izin ver
            }
        };
    }
}
