package com.furkankozmac.takttwin.core.application.event;

import com.furkankozmac.takttwin.core.domain.model.TelemetryLog;

public class TelemetryEvent {
    private final TelemetryLog telemetryLog;

    public TelemetryEvent(TelemetryLog telemetryLog) {
        this.telemetryLog = telemetryLog;
    }

    public TelemetryLog getTelemetryLog() {
        return telemetryLog;
    }
}
