package com.furkankozmac.takttwin.infrastructure.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleResponseDto {
    private String serialNumber;
    private String productModel;
    private String status;
    private String currentStationName;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
    private List<TimelineStepDto> timeline;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TimelineStepDto {
        private String stationName;
        private String workElementName;
        private String workType;
        private Double actualDuration;
        private LocalDateTime timestamp;
        private boolean triggeredAlert;
    }
}
