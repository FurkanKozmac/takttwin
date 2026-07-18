package com.furkankozmac.takttwin.infrastructure.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OeeResponseDto {
    private Double oeePercentage;
    private Double availability;
    private Double performance;
    private Double quality;
    private Double totalDowntimeSeconds;
    private Double lineHealth;
    private Integer activeAlertCount;
    private Integer totalCompletedUnits;
}
