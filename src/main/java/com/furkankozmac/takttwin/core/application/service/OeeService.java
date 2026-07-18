package com.furkankozmac.takttwin.core.application.service;

import com.furkankozmac.takttwin.core.application.port.*;
import com.furkankozmac.takttwin.core.domain.exception.EntityNotFoundException;
import com.furkankozmac.takttwin.core.domain.model.*;
import com.furkankozmac.takttwin.infrastructure.web.dto.OeeResponseDto;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

public class OeeService {

    private final ProductionOrderPort productionOrderPort;
    private final TelemetryLogPort telemetryLogPort;
    private final AndonAlertPort andonAlertPort;
    private final StationPort stationPort;

    public OeeService(ProductionOrderPort productionOrderPort,
                      TelemetryLogPort telemetryLogPort,
                      AndonAlertPort andonAlertPort,
                      StationPort stationPort) {
        this.productionOrderPort = productionOrderPort;
        this.telemetryLogPort = telemetryLogPort;
        this.andonAlertPort = andonAlertPort;
        this.stationPort = stationPort;
    }

    public OeeResponseDto calculateActiveOrderOee() {
        ProductionOrder activeOrder = productionOrderPort.findActiveOrder()
                .orElseThrow(() -> new EntityNotFoundException("No active production order found"));

        LocalDateTime startTime = activeOrder.getCreatedAt();
        LocalDateTime now = LocalDateTime.now();

        // 1. Availability (A)
        long elapsedSeconds = Duration.between(startTime, now).getSeconds();
        Double totalDowntimeSeconds = andonAlertPort.calculateTotalDowntimeSeconds(startTime);
        if (totalDowntimeSeconds == null) {
            totalDowntimeSeconds = 0.0;
        }

        // Also add current running downtime of unresolved alerts
        List<AndonAlert> unresolvedAlerts = andonAlertPort.findActiveAlerts();
        double ongoingDowntime = unresolvedAlerts.stream()
                .filter(a -> a.getCreatedAt().isAfter(startTime))
                .mapToDouble(a -> Duration.between(a.getCreatedAt(), now).getSeconds())
                .sum();

        double cumulativeDowntime = totalDowntimeSeconds + ongoingDowntime;

        double availability = 1.0;
        if (elapsedSeconds > 0) {
            availability = Math.max(0.0, (double) (elapsedSeconds - cumulativeDowntime) / elapsedSeconds);
        }

        // 2. Performance (P)
        double totalActualDuration = 0.0;
        double totalStandardDuration = 0.0;
        List<Station> stations = stationPort.findAll();
        for (Station station : stations) {
            List<Object[]> sumsList = telemetryLogPort.getDurationSumsByStationIdAndStartTime(station.getId(), startTime);
            if (sumsList != null && !sumsList.isEmpty()) {
                Object[] sums = sumsList.get(0);
                if (sums != null && sums.length == 2) {
                    Double actualSum = (Double) sums[0];
                    Double standardSum = (Double) sums[1];
                    totalActualDuration += (actualSum != null) ? actualSum : 0.0;
                    totalStandardDuration += (standardSum != null) ? standardSum : 0.0;
                }
            }
        }

        double performance = 1.0;
        if (totalActualDuration > 0) {
            performance = totalStandardDuration / totalActualDuration;
        }

        // 3. Quality (Q)
        int completedQuantity = activeOrder.getCompletedQuantity();
        List<AndonAlert> alertsThisOrder = andonAlertPort.findAlertsByCreatedAtAfter(startTime);
        long vehiclesWithAlert = alertsThisOrder.stream()
                .map(AndonAlert::getCycleNumber)
                .distinct()
                .count();

        double quality = 1.0;
        if (completedQuantity > 0) {
            quality = Math.max(0.0, (double) (completedQuantity - vehiclesWithAlert) / completedQuantity);
        }

        // Overall OEE
        double oee = availability * performance * quality;

        // Line Health: Starts at 100%, drops by 15% for every active/unresolved alert currently on the line
        int activeAlertCount = unresolvedAlerts.size();
        double lineHealth = Math.max(0.0, 100.0 - (15.0 * activeAlertCount));

        return OeeResponseDto.builder()
                .oeePercentage(Math.round(oee * 1000.0) / 10.0)
                .availability(Math.round(availability * 1000.0) / 10.0)
                .performance(Math.round(performance * 1000.0) / 10.0)
                .quality(Math.round(quality * 1000.0) / 10.0)
                .totalDowntimeSeconds((double) Math.round(cumulativeDowntime))
                .lineHealth(lineHealth)
                .activeAlertCount(activeAlertCount)
                .totalCompletedUnits(completedQuantity)
                .build();
    }
}
