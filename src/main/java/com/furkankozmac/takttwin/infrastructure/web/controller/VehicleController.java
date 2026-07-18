package com.furkankozmac.takttwin.infrastructure.web.controller;

import com.furkankozmac.takttwin.core.application.port.AndonAlertPort;
import com.furkankozmac.takttwin.core.application.port.StationPort;
import com.furkankozmac.takttwin.core.application.port.WorkElementPort;
import com.furkankozmac.takttwin.core.application.service.VehicleService;
import com.furkankozmac.takttwin.core.domain.model.AndonAlert;
import com.furkankozmac.takttwin.core.domain.model.Station;
import com.furkankozmac.takttwin.core.domain.model.TelemetryLog;
import com.furkankozmac.takttwin.core.domain.model.Vehicle;
import com.furkankozmac.takttwin.core.domain.model.WorkElement;
import com.furkankozmac.takttwin.infrastructure.web.dto.VehicleResponseDto;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    private final VehicleService vehicleService;
    private final StationPort stationPort;
    private final WorkElementPort workElementPort;
    private final AndonAlertPort andonAlertPort;

    public VehicleController(VehicleService vehicleService,
                             StationPort stationPort,
                             WorkElementPort workElementPort,
                             AndonAlertPort andonAlertPort) {
        this.vehicleService = vehicleService;
        this.stationPort = stationPort;
        this.workElementPort = workElementPort;
        this.andonAlertPort = andonAlertPort;
    }

    @GetMapping("/{serialNumber}/traceability")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_LEADER', 'OPERATOR', 'HSE_SPECIALIST')")
    public ResponseEntity<VehicleResponseDto> getVehicleTraceability(@PathVariable("serialNumber") String serialNumber) {
        Vehicle vehicle = vehicleService.getVehicleGenealogy(serialNumber);

        List<VehicleResponseDto.TimelineStepDto> timelineSteps = new ArrayList<>();
        List<TelemetryLog> history = vehicle.getHistory();

        // For each log, resolve the details
        if (history != null) {
            for (TelemetryLog log : history) {
                String stationName = stationPort.findById(log.getStationId())
                        .map(Station::getName)
                        .orElse("Unknown Station");

                String workElementName = "Unknown Element";
                String workType = "Unknown Type";
                List<WorkElement> elements = workElementPort.findByStationId(log.getStationId());
                if (elements != null) {
                    for (WorkElement el : elements) {
                        if (el.getId().equals(log.getWorkElementId())) {
                            workElementName = el.getName();
                            workType = el.getWorkType() != null ? el.getWorkType().name() : "Unknown Type";
                            break;
                        }
                    }
                }

                // Check if an Andon Alert was triggered for this station and cycle number
                boolean triggeredAlert = false;
                List<AndonAlert> alerts = andonAlertPort.findAlertsByStationIdAndCreatedAtAfter(log.getStationId(), vehicle.getCreatedAt());
                if (alerts != null) {
                    for (AndonAlert alert : alerts) {
                        if (alert.getCycleNumber().equals(log.getCycleNumber())) {
                            triggeredAlert = true;
                            break;
                        }
                    }
                }

                timelineSteps.add(VehicleResponseDto.TimelineStepDto.builder()
                        .stationName(stationName)
                        .workElementName(workElementName)
                        .workType(workType)
                        .actualDuration(log.getActualDuration())
                        .timestamp(log.getCreatedAt())
                        .triggeredAlert(triggeredAlert)
                        .build());
            }
        }

        // Sort by timestamp asc
        timelineSteps.sort((a, b) -> a.getTimestamp().compareTo(b.getTimestamp()));

        VehicleResponseDto response = VehicleResponseDto.builder()
                .serialNumber(vehicle.getSerialNumber())
                .productModel(vehicle.getProductionOrder() != null ? vehicle.getProductionOrder().getProductModel() : "Unknown")
                .status(vehicle.getStatus().name())
                .currentStationName(vehicle.getCurrentStation() != null ? vehicle.getCurrentStation().getName() : null)
                .createdAt(vehicle.getCreatedAt())
                .completedAt(vehicle.getCompletedAt())
                .timeline(timelineSteps)
                .build();

        return ResponseEntity.ok(response);
    }
}
