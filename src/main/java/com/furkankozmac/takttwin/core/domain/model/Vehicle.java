package com.furkankozmac.takttwin.core.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vehicle {
    private Long id;
    private String serialNumber;
    private ProductionOrder productionOrder;
    private Station currentStation;
    private VehicleStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
    private List<TelemetryLog> history;
}
