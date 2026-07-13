package com.furkankozmac.takttwin.core.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Station {
    private long id;
    private String name;
    private Double taktTime;

    @Builder.Default
    private List<WorkElement> workElements = new ArrayList<>();

    public Double calculateTotalCycleTime() {
        if (workElements == null || workElements.isEmpty()) {
            return 0.0;
        }
        return workElements.stream()
                .mapToDouble(WorkElement::getStandardDuration)
                .sum();
    }

    /**
     * İstasyonun darboğazda (overload) olup olmadığını kontrol eder.
     * Eğer Toplam Süre > Takt Süresi ise sistem darboğazdadır.
     */
    public boolean isOverloaded() {
        return calculateTotalCycleTime() > taktTime;
    }
}
