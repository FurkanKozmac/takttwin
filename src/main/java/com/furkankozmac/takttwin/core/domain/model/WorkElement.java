package com.furkankozmac.takttwin.core.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkElement {
    private Long id;
    private String name;
    private Double standardDuration;
    private WorkType workType;
    private Long stationId;

    private boolean isValueAdded;
}
