package com.furkankozmac.takttwin.core.domain.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AndonAlert {
    private Long id;
    private Long stationId;
    private Long cycleNumber;
    private Double totalCycleTime;
    private Double taktTime;
    private String message;
    private boolean resolved;
    private LocalDateTime createdAt;

    public static AndonAlert create(Long stationId, Long cycleNumber, Double totalCycleTime, Double taktTime, String message) {
        return AndonAlert.builder()
                .stationId(stationId)
                .cycleNumber(cycleNumber)
                .totalCycleTime(totalCycleTime)
                .taktTime(taktTime)
                .message(message)
                .resolved(false)
                .createdAt(LocalDateTime.now())
                .build();
    }
}
