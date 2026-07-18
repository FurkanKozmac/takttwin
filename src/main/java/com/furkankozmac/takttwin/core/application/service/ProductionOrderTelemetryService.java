package com.furkankozmac.takttwin.core.application.service;

import com.furkankozmac.takttwin.core.application.port.*;
import com.furkankozmac.takttwin.core.domain.model.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.List;

public class ProductionOrderTelemetryService extends TelemetryService {

    private static final Logger log = LoggerFactory.getLogger(ProductionOrderTelemetryService.class);

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

        // Determine the final station dynamically (highest ID = last on line)
        List<Long> allStationIds = stationPort.findAllIds();
        if (!allStationIds.isEmpty()) {
            Long finalStationId = allStationIds.stream().max(Long::compareTo).orElse(-1L);
            if (log.getStationId() != null && log.getStationId().equals(finalStationId)) {
                List<WorkElement> definedElements = workElementPort.findByStationId(finalStationId);
                List<TelemetryLog> cycleLogs = telemetryLogPort.findByCycleNumber(log.getCycleNumber());
                
                long stationCycleCount = cycleLogs.stream()
                        .filter(l -> l.getStationId() != null && l.getStationId().equals(finalStationId))
                        .count();

                if (definedElements != null && !definedElements.isEmpty() && stationCycleCount == definedElements.size()) {
                    // All elements for station 6 in this cycle have been processed successfully!
                    productionOrderPort.findActiveOrder().ifPresent(order -> {
                        productionOrderPort.incrementCompletedQuantity(order.getId());
                        
                        // Re-read to check if completed
                        productionOrderPort.findById(order.getId()).ifPresent(updated -> {
                            if (updated.getCompletedQuantity() >= updated.getTargetQuantity()) {
                                updated.setStatus(OrderStatus.COMPLETED);
                                ProductionOrderTelemetryService.log.info("PRODUCTION ORDER COMPLETED: {}", updated.getOrderNumber());
                                productionOrderPort.save(updated);
                            }
                        });
                    });
                }
            }
        }

        return savedLog;
    }
}
