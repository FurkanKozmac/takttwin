package com.furkankozmac.takttwin.core.application.service;

import com.furkankozmac.takttwin.core.application.port.StationPort;
import com.furkankozmac.takttwin.core.application.port.TelemetryLogPort;
import com.furkankozmac.takttwin.core.application.port.WorkElementPort;
import com.furkankozmac.takttwin.core.domain.exception.EntityNotFoundException;
import com.furkankozmac.takttwin.core.domain.model.Station;
import com.furkankozmac.takttwin.core.domain.model.WorkElement;
import com.furkankozmac.takttwin.core.domain.model.YamazumiItem;

import java.util.ArrayList;
import java.util.List;

public class YamazumiService {
    private final StationPort stationPort;
    private final WorkElementPort workElementPort;
    private final TelemetryLogPort telemetryLogPort;

    public YamazumiService(StationPort stationPort,
                           WorkElementPort workElementPort,
                           TelemetryLogPort telemetryLogPort) {
        this.stationPort = stationPort;
        this.workElementPort = workElementPort;
        this.telemetryLogPort = telemetryLogPort;
    }

    public List<YamazumiItem> getYamazumiChartData(Long stationId) {
        Station station = stationPort.findById(stationId)
                .orElseThrow(() -> new EntityNotFoundException("Station with id " + stationId + " not found."));

        List<WorkElement> workElements = workElementPort.findByStationId(stationId);
        List<YamazumiItem> chartData = new ArrayList<>();

        for (WorkElement workElement : workElements) {
            double avgActual = telemetryLogPort.getAverageDurationByElementId(workElement.getId());

            avgActual = Math.round(avgActual * 100.0) / 100.0;

            YamazumiItem item = YamazumiItem.create(workElement, avgActual);

            chartData.add(item);
        }

        return chartData;
    }
}
