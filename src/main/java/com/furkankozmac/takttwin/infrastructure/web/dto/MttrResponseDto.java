package com.furkankozmac.takttwin.infrastructure.web.dto;

import com.furkankozmac.takttwin.core.domain.model.AndonAlert;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MttrResponseDto {
    private Double mttrSeconds;
    private Integer totalResolvedAlertCount;
    private List<AndonAlert> resolvedAlertsList;
}
