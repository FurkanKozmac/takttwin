package com.furkankozmac.takttwin.core.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TelemetryLog {
    private Long id;
    private Long stationId;
    private Long workElementId;
    private Double actualDuration;
    private Long cycleNumber;
    private LocalDateTime createdAt;
}
