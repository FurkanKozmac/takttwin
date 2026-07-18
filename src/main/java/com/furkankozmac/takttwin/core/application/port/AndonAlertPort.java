package com.furkankozmac.takttwin.core.application.port;

import com.furkankozmac.takttwin.core.domain.model.AndonAlert;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AndonAlertPort {
    AndonAlert save(AndonAlert alert);
    List<AndonAlert> findActiveAlerts();
    List<AndonAlert> findResolvedAlerts();
    Optional<AndonAlert> findById(Long id);
    List<AndonAlert> findAlertsByStationIdAndCreatedAtAfter(Long stationId, LocalDateTime startTime);
    List<AndonAlert> findAlertsByCreatedAtAfter(LocalDateTime startTime);
    Double calculateTotalDowntimeSeconds(LocalDateTime startTime);
}
