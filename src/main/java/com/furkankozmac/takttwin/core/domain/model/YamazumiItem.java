package com.furkankozmac.takttwin.core.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class YamazumiItem {
    private Long elementId;
    private String elementName;
    private Double standardDuration;
    private Double averageActualDuration;
    private WorkType workType;
    private boolean isValueAdded;

    public static YamazumiItem create(WorkElement element, double avgActual) {
        return YamazumiItem.builder()
                .elementId(element.getId())
                .elementName(element.getName())
                .standardDuration(element.getStandardDuration())
                .averageActualDuration(avgActual)
                .workType(element.getWorkType())
                .isValueAdded(element.isValueAdded())
                .build();
    }
}
