package com.furkankozmac.takttwin.infrastructure.web.controller;

import com.furkankozmac.takttwin.core.application.service.TelemetryService;
import com.furkankozmac.takttwin.core.domain.model.TelemetryLog;
import com.furkankozmac.takttwin.infrastructure.web.dto.TelemetrySubmitRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/telemetry")
public class TelemetryController {

    private final TelemetryService telemetryService;

    public TelemetryController(TelemetryService telemetryService) {
        this.telemetryService = telemetryService;
    }

    @PostMapping
    public ResponseEntity<TelemetryLog> submitTelemetry(@Valid @RequestBody TelemetrySubmitRequest request) {
        TelemetryLog domainLog = TelemetryLog.builder()
                .stationId(request.getStationId())
                .workElementId(request.getWorkElementId())
                .actualDuration(request.getActualDuration())
                .cycleNumber(request.getCycleNumber())
                .build();

        TelemetryLog savedLog = telemetryService.submitTelemetry(domainLog);
        return ResponseEntity.ok(savedLog);
    }
}