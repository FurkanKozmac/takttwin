package com.furkankozmac.takttwin.core.application.service;

import com.furkankozmac.takttwin.core.application.event.OrderEvent;
import com.furkankozmac.takttwin.core.application.port.*;
import com.furkankozmac.takttwin.core.domain.model.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import java.time.LocalDateTime;
import java.util.List;

public class ProductionOrderTelemetryService extends TelemetryService {

    private static final Logger log = LoggerFactory.getLogger(ProductionOrderTelemetryService.class);

    private final ProductionOrderPort productionOrderPort;
    private final StationPort stationPort;
    private final WorkElementPort workElementPort;
    private final TelemetryLogPort telemetryLogPort;
    private final VehiclePort vehiclePort;

    public ProductionOrderTelemetryService(TelemetryLogPort telemetryLogPort,
                                           StationPort stationPort,
                                           WorkElementPort workElementPort,
                                           AndonAlertPort andonAlertPort,
                                           ProductionOrderPort productionOrderPort,
                                           VehiclePort vehiclePort,
                                           ApplicationEventPublisher eventPublisher,
                                           com.furkankozmac.takttwin.core.application.port.MaterialPort materialPort) {
        super(telemetryLogPort, stationPort, workElementPort, andonAlertPort, eventPublisher, materialPort);
        this.telemetryLogPort = telemetryLogPort;
        this.stationPort = stationPort;
        this.workElementPort = workElementPort;
        this.productionOrderPort = productionOrderPort;
        this.vehiclePort = vehiclePort;
    }

    @Override
    public TelemetryLog submitTelemetry(TelemetryLog logObj) {
        // WIP / Traceability Integration: Find or create the Vehicle
        String serialNumber = String.valueOf(logObj.getCycleNumber());
        List<Long> allStationIds = stationPort.findAllIds();
        
        Vehicle vehicle = vehiclePort.findBySerialNumber(serialNumber).orElseGet(() -> {
            ProductionOrder activeOrder = productionOrderPort.findActiveOrder().orElse(null);
            if (activeOrder == null) return null;

            Long firstStationId = allStationIds.stream().min(Long::compareTo).orElse(1L);
            Station firstStation = stationPort.findById(firstStationId).orElse(null);

            Vehicle newVehicle = Vehicle.builder()
                    .serialNumber(serialNumber)
                    .productionOrder(activeOrder)
                    .currentStation(firstStation)
                    .status(VehicleStatus.IN_PRODUCTION)
                    .createdAt(LocalDateTime.now())
                    .build();
            return vehiclePort.save(newVehicle);
        });

        if (vehicle != null) {
            // Pre-populate vehicleId on the log object before database write
            logObj.setVehicleId(vehicle.getId());
            
            // WIP Tracking: update current station to the station that sent the telemetry
            Station currentStation = stationPort.findById(logObj.getStationId()).orElse(null);
            vehicle.setCurrentStation(currentStation);
            vehiclePort.save(vehicle);
        }

        TelemetryLog savedLog = super.submitTelemetry(logObj);

        // Determine the final station dynamically (highest ID = last on line)
        if (!allStationIds.isEmpty()) {
            Long finalStationId = allStationIds.stream().max(Long::compareTo).orElse(-1L);
            if (logObj.getStationId() != null && logObj.getStationId().equals(finalStationId)) {
                List<WorkElement> definedElements = workElementPort.findByStationId(finalStationId);
                List<TelemetryLog> cycleLogs = telemetryLogPort.findByCycleNumber(logObj.getCycleNumber());
                
                long stationCycleCount = cycleLogs.stream()
                        .filter(l -> l.getStationId() != null && l.getStationId().equals(finalStationId))
                        .count();

                if (definedElements != null && !definedElements.isEmpty() && stationCycleCount == definedElements.size()) {
                    // Vehicle completed final VES check at final station!
                    if (vehicle != null) {
                        vehicle.setStatus(VehicleStatus.COMPLETED);
                        vehicle.setCurrentStation(null);
                        vehicle.setCompletedAt(LocalDateTime.now());
                        vehiclePort.save(vehicle);
                    }

                    // Increment production order completed count
                    productionOrderPort.findActiveOrder().ifPresent(order -> {
                        productionOrderPort.incrementCompletedQuantity(order.getId());
                        
                        // Re-read to check if completed
                        productionOrderPort.findById(order.getId()).ifPresent(updated -> {
                            if (updated.getCompletedQuantity() >= updated.getTargetQuantity()) {
                                updated.setStatus(OrderStatus.COMPLETED);
                                ProductionOrderTelemetryService.log.info("PRODUCTION ORDER COMPLETED: {}", updated.getOrderNumber());
                                ProductionOrder savedOrder = productionOrderPort.save(updated);
                                eventPublisher.publishEvent(new OrderEvent(savedOrder));
                            } else {
                                eventPublisher.publishEvent(new OrderEvent(updated));
                            }
                        });
                    });
                }
            }
        }

        return savedLog;
    }
}
