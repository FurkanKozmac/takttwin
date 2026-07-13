package com.furkankozmac.takttwin.core.application.port;

import com.furkankozmac.takttwin.core.domain.model.AndonAlert;

import java.util.List;

public interface AndonAlertPort {
    AndonAlert save(AndonAlert alert);
    List<AndonAlert> findActiveAlerts();
}
