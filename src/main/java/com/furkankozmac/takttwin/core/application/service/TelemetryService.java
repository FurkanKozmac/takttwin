package com.furkankozmac.takttwin.core.application.service;

import com.furkankozmac.takttwin.core.application.port.AndonAlertPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.furkankozmac.takttwin.core.application.port.StationPort;
import com.furkankozmac.takttwin.core.application.port.TelemetryLogPort;
import com.furkankozmac.takttwin.core.application.port.WorkElementPort;
import com.furkankozmac.takttwin.core.domain.exception.EntityNotFoundException;
import com.furkankozmac.takttwin.core.domain.model.AndonAlert;
import com.furkankozmac.takttwin.core.domain.model.Station;
import com.furkankozmac.takttwin.core.domain.model.TelemetryLog;
import com.furkankozmac.takttwin.core.domain.model.WorkElement;

import java.time.LocalDateTime;
import java.util.List;

public class TelemetryService {

    private static final Logger log = LoggerFactory.getLogger(TelemetryService.class);

    private final TelemetryLogPort telemetryLogPort;
    private final StationPort stationPort;
    private final WorkElementPort workElementPort;
    private final AndonAlertPort andonAlertPort;

    public TelemetryService(TelemetryLogPort telemetryLogPort,
                            StationPort stationPort,
                            WorkElementPort workElementPort,
                            AndonAlertPort andonAlertPort) {
        this.telemetryLogPort = telemetryLogPort;
        this.stationPort = stationPort;
        this.workElementPort = workElementPort;
        this.andonAlertPort = andonAlertPort;
    }

    public TelemetryLog submitTelemetry(TelemetryLog log) {
        Station station = stationPort.findById(log.getStationId()).orElseThrow(() -> new EntityNotFoundException("Station with id " + log.getStationId() + " not found"));

        List<WorkElement> definedElements = workElementPort.findByStationId(log.getStationId());
        boolean elementExists = definedElements.stream().anyMatch(e -> e.getId().equals(log.getWorkElementId()));

        if (!elementExists) {
            throw new EntityNotFoundException("WorkElement with id " + log.getWorkElementId() + " not found");
        }

        log.setCreatedAt(LocalDateTime.now());
        TelemetryLog savedLog = telemetryLogPort.save(log);

        List<TelemetryLog> cycleLogs = telemetryLogPort.findByCycleNumber(log.getCycleNumber());

        long stationCycleCount = cycleLogs.stream()
                .filter(l -> l.getStationId().equals(log.getStationId()))
                .count();

        if (stationCycleCount == definedElements.size()) {
            analyzeCycleAndTriggerAndon(log.getStationId(), log.getCycleNumber(), station, cycleLogs);
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
            andonAlertPort.save(alert);
        }
    }
}
