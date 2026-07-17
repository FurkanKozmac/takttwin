package com.furkankozmac.takttwin.core.application.service;

import com.furkankozmac.takttwin.core.application.port.*;
import com.furkankozmac.takttwin.core.domain.model.*;
import java.util.List;

public class ProductionOrderTelemetryService extends TelemetryService {

    private final ProductionOrderPort productionOrderPort;
    private final StationPort stationPort;
    private final WorkElementPort workElementPort;
    private final TelemetryLogPort telemetryLogPort;

    public ProductionOrderTelemetryService(TelemetryLogPort telemetryLogPort,
                                           StationPort stationPort,
                                           WorkElementPort workElementPort,
                                           AndonAlertPort andonAlertPort,
                                           ProductionOrderPort productionOrderPort) {
        super(telemetryLogPort, stationPort, workElementPort, andonAlertPort);
        this.telemetryLogPort = telemetryLogPort;
        this.stationPort = stationPort;
        this.workElementPort = workElementPort;
        this.productionOrderPort = productionOrderPort;
    }

    @Override
    public TelemetryLog submitTelemetry(TelemetryLog log) {
        TelemetryLog savedLog = super.submitTelemetry(log);

        // Integration: cycle completion at FINAL station (Inspection, Station ID: 6)
        if (log.getStationId() != null && log.getStationId() == 6L) {
            List<WorkElement> definedElements = workElementPort.findByStationId(6L);
            List<TelemetryLog> cycleLogs = telemetryLogPort.findByCycleNumber(log.getCycleNumber());
            
            long stationCycleCount = cycleLogs.stream()
                    .filter(l -> l.getStationId() != null && l.getStationId() == 6L)
                    .count();

            if (definedElements != null && !definedElements.isEmpty() && stationCycleCount == definedElements.size()) {
                // All elements for station 6 in this cycle have been processed successfully!
                productionOrderPort.findActiveOrder().ifPresent(order -> {
                    int completed = order.getCompletedQuantity() + 1;
                    order.setCompletedQuantity(completed);

                    if (completed >= order.getTargetQuantity()) {
                        order.setStatus(OrderStatus.COMPLETED);
                        System.out.println("PRODUCTION ORDER COMPLETED: " + order.getOrderNumber());
                    }
                    productionOrderPort.save(order);
                });
            }
        }

        return savedLog;
    }
}
