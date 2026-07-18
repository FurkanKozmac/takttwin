package com.furkankozmac.takttwin.core.application.service;

import com.furkankozmac.takttwin.core.application.event.AndonEvent;
import com.furkankozmac.takttwin.core.application.event.TelemetryEvent;
import com.furkankozmac.takttwin.core.application.port.AndonAlertPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import com.furkankozmac.takttwin.core.application.port.StationPort;
import com.furkankozmac.takttwin.core.application.port.TelemetryLogPort;
import com.furkankozmac.takttwin.core.application.port.WorkElementPort;
import com.furkankozmac.takttwin.core.application.port.MaterialPort;
import com.furkankozmac.takttwin.core.domain.exception.EntityNotFoundException;
import com.furkankozmac.takttwin.core.domain.model.AndonAlert;
import com.furkankozmac.takttwin.core.domain.model.Station;
import com.furkankozmac.takttwin.core.domain.model.TelemetryLog;
import com.furkankozmac.takttwin.core.domain.model.WorkElement;
import com.furkankozmac.takttwin.core.domain.model.Material;

import java.time.LocalDateTime;
import java.util.List;

public class TelemetryService {

    private static final Logger log = LoggerFactory.getLogger(TelemetryService.class);

    private final TelemetryLogPort telemetryLogPort;
    private final StationPort stationPort;
    private final WorkElementPort workElementPort;
    private final AndonAlertPort andonAlertPort;
    protected final ApplicationEventPublisher eventPublisher;
    private final MaterialPort materialPort;

    public TelemetryService(TelemetryLogPort telemetryLogPort,
                            StationPort stationPort,
                            WorkElementPort workElementPort,
                            AndonAlertPort andonAlertPort,
                            ApplicationEventPublisher eventPublisher,
                            MaterialPort materialPort) {
        this.telemetryLogPort = telemetryLogPort;
        this.stationPort = stationPort;
        this.workElementPort = workElementPort;
        this.andonAlertPort = andonAlertPort;
        this.eventPublisher = eventPublisher;
        this.materialPort = materialPort;
    }

    public TelemetryLog submitTelemetry(TelemetryLog logObj) {
        Station station = stationPort.findById(logObj.getStationId()).orElseThrow(() -> new EntityNotFoundException("Station with id " + logObj.getStationId() + " not found"));

        List<WorkElement> definedElements = workElementPort.findByStationId(logObj.getStationId());
        WorkElement workElement = definedElements.stream()
                .filter(e -> e.getId().equals(logObj.getWorkElementId()))
                .findFirst()
                .orElseThrow(() -> new EntityNotFoundException("WorkElement with id " + logObj.getWorkElementId() + " not found"));

        // JIT Material Stock tracking logic
        if (workElement.getMaterialId() != null) {
            Material material = materialPort.findById(workElement.getMaterialId())
                    .orElseThrow(() -> new EntityNotFoundException("Material with id " + workElement.getMaterialId() + " not found"));

            int consumption = workElement.getMaterialConsumptionQuantity() != null ? workElement.getMaterialConsumptionQuantity() : 0;
            int newStock = material.getStockQuantity() - consumption;

            if (newStock <= 0) {
                // Save alert first
                String alertMessage = String.format("ANDON ALERT! Material '%s' is OUT OF STOCK at %s. Conveyor line stopped immediately!",
                        material.getName(), station.getName());

                log.error(alertMessage);

                AndonAlert alert = AndonAlert.create(logObj.getStationId(), logObj.getCycleNumber(), 0.0, station.getTaktTime(), alertMessage);
                AndonAlert savedAlert = andonAlertPort.save(alert);
                eventPublisher.publishEvent(new AndonEvent(savedAlert));

                // Deduct stock down to 0 and save so DB is updated
                material.setStockQuantity(Math.max(0, newStock));
                Material savedMaterial = materialPort.save(material);
                eventPublisher.publishEvent(new com.furkankozmac.takttwin.core.application.event.MaterialEvent(savedMaterial));

                throw new com.furkankozmac.takttwin.core.domain.exception.MaterialOutOfStockException(alertMessage);
            }

            material.setStockQuantity(newStock);
            Material savedMaterial = materialPort.save(material);
            eventPublisher.publishEvent(new com.furkankozmac.takttwin.core.application.event.MaterialEvent(savedMaterial));
        }

        logObj.setCreatedAt(LocalDateTime.now());
        TelemetryLog savedLog = telemetryLogPort.save(logObj);
        eventPublisher.publishEvent(new TelemetryEvent(savedLog));

        List<TelemetryLog> cycleLogs = telemetryLogPort.findByCycleNumber(logObj.getCycleNumber());

        long stationCycleCount = cycleLogs.stream()
                .filter(l -> l.getStationId().equals(logObj.getStationId()))
                .count();

        if (stationCycleCount == definedElements.size()) {
            analyzeCycleAndTriggerAndon(logObj.getStationId(), logObj.getCycleNumber(), station, cycleLogs);
        }

        return savedLog;
    }

    private void analyzeCycleAndTriggerAndon(Long stationId, Long cycleNumber, Station station, List<TelemetryLog> cycleLogs) {

        double totalActualDuration = cycleLogs.stream()
                .filter(l -> l.getStationId().equals(stationId))
                .mapToDouble(TelemetryLog::getActualDuration)
                .sum();

        double taktTime = station.getTaktTime();

        log.info("Çevrim #{} tamamlandı. İstasyon: {} | Toplam Süre: {}s | Hedef Takt Süresi: {}s",
                cycleNumber, station.getName(), String.format("%.2f", totalActualDuration), String.format("%.2f", taktTime));

        if (totalActualDuration > taktTime) {
            double delay = totalActualDuration - taktTime;
            String alertMessage = String.format("ANDON UYARISI! %s istasyonunda Çevrim #%d için hedef Takt Süresi %.2f saniye aşıldı!",
                    station.getName(), cycleNumber, delay);

            log.warn(alertMessage);

            AndonAlert alert = AndonAlert.create(stationId, cycleNumber, totalActualDuration, taktTime, alertMessage);
            AndonAlert savedAlert = andonAlertPort.save(alert);
            eventPublisher.publishEvent(new AndonEvent(savedAlert));
        }
    }
}
