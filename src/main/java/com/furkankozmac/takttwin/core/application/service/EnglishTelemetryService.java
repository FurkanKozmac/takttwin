package com.furkankozmac.takttwin.core.application.service;

import com.furkankozmac.takttwin.core.application.port.AndonAlertPort;
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

public class EnglishTelemetryService extends TelemetryService {

    private final TelemetryLogPort telemetryLogPort;
    private final StationPort stationPort;
    private final WorkElementPort workElementPort;
    private final AndonAlertPort andonAlertPort;

    public EnglishTelemetryService(TelemetryLogPort telemetryLogPort,
                                   StationPort stationPort,
                                   WorkElementPort workElementPort,
                                   AndonAlertPort andonAlertPort) {
        super(telemetryLogPort, stationPort, workElementPort, andonAlertPort);
        this.telemetryLogPort = telemetryLogPort;
        this.stationPort = stationPort;
        this.workElementPort = workElementPort;
        this.andonAlertPort = andonAlertPort;
    }

    @Override
    public TelemetryLog submitTelemetry(TelemetryLog log) {
        Station station = stationPort.findById(log.getStationId())
                .orElseThrow(() -> new EntityNotFoundException("Station with id " + log.getStationId() + " not found"));

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

        System.out.println(String.format("[ANALYSIS] Cycle #%d completed. Station: %s | Total Duration: %.2fs | Target Takt Time: %.2fs",
                cycleNumber, station.getName(), totalActualDuration, taktTime));

        if (totalActualDuration > taktTime) {
            double delay = totalActualDuration - taktTime;
            String alertMessage = String.format("ANDON ALERT! Station %s exceeded Takt Time by %.2fs on Cycle #%d!",
                    station.getName(), delay, cycleNumber);

            System.err.println("[!!!] " + alertMessage);

            AndonAlert alert = AndonAlert.create(stationId, cycleNumber, totalActualDuration, taktTime, alertMessage);
            andonAlertPort.save(alert);
        }
    }
}
