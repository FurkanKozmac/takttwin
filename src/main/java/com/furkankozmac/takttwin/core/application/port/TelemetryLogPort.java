package com.furkankozmac.takttwin.core.application.port;

import com.furkankozmac.takttwin.core.domain.model.TelemetryLog;

import java.time.LocalDateTime;
import java.util.List;

public interface TelemetryLogPort {
    TelemetryLog save(TelemetryLog telemetryLog);
    List<TelemetryLog> findByCycleNumber(Long cycleNumber);
    Double getAverageDurationByElementId(Long elementId);
    List<Object[]> getDurationSumsByStationIdAndStartTime(Long stationId, LocalDateTime startTime);
}
