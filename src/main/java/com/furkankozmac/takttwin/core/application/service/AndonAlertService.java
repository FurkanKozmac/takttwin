package com.furkankozmac.takttwin.core.application.service;

import com.furkankozmac.takttwin.core.application.port.AndonAlertPort;
import com.furkankozmac.takttwin.core.domain.exception.EntityNotFoundException;
import com.furkankozmac.takttwin.core.domain.model.AndonAlert;

import java.util.List;

public class AndonAlertService {

    private final AndonAlertPort andonAlertPort;

    public AndonAlertService(AndonAlertPort andonAlertPort) {
        this.andonAlertPort = andonAlertPort;
    }

    public List<AndonAlert> getActiveAlerts() {
        return andonAlertPort.findActiveAlerts();
    }

    public AndonAlert resolveAlert(Long id, String resolvedBy, String comment) {
        AndonAlert alert = andonAlertPort.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Andon uyarısı bulunamadı ID: " + id));

        alert.setResolved(true);
        alert.setResolvedAt(java.time.LocalDateTime.now());
        alert.setResolvedBy(resolvedBy);
        alert.setResolutionComment(comment);

        return andonAlertPort.save(alert);
    }
}