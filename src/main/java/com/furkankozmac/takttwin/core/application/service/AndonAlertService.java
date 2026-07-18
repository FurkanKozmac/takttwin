package com.furkankozmac.takttwin.core.application.service;

import com.furkankozmac.takttwin.core.application.event.AndonEvent;
import com.furkankozmac.takttwin.core.application.port.AndonAlertPort;
import com.furkankozmac.takttwin.core.domain.exception.EntityNotFoundException;
import com.furkankozmac.takttwin.core.domain.model.AndonAlert;
import org.springframework.context.ApplicationEventPublisher;

import java.util.List;

public class AndonAlertService {

    private final AndonAlertPort andonAlertPort;
    private final ApplicationEventPublisher eventPublisher;

    public AndonAlertService(AndonAlertPort andonAlertPort, ApplicationEventPublisher eventPublisher) {
        this.andonAlertPort = andonAlertPort;
        this.eventPublisher = eventPublisher;
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

        AndonAlert saved = andonAlertPort.save(alert);
        eventPublisher.publishEvent(new AndonEvent(saved));
        return saved;
    }

    public List<AndonAlert> getResolvedAlerts() {
        return andonAlertPort.findResolvedAlerts();
    }

    public Double calculateMttrSeconds() {
        List<AndonAlert> resolved = andonAlertPort.findResolvedAlerts();
        if (resolved == null || resolved.isEmpty()) {
            return 0.0;
        }

        double totalSeconds = 0.0;
        int count = 0;
        for (AndonAlert alert : resolved) {
            if (alert.getCreatedAt() != null && alert.getResolvedAt() != null) {
                totalSeconds += java.time.Duration.between(alert.getCreatedAt(), alert.getResolvedAt()).getSeconds();
                count++;
            }
        }

        if (count == 0) {
            return 0.0;
        }
        return totalSeconds / count;
    }
}