package com.furkankozmac.takttwin.infrastructure.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TelemetrySubmitRequest {

    @NotNull(message = "İstasyon ID boş bırakılamaz")
    private Long stationId;

    @NotNull(message = "Eleman iş ID boş bırakılamaz")
    private Long workElementId;

    @Positive(message = "Gerçekleşen süre sıfırdan büyük olmalıdır")
    private Double actualDuration;

    @NotNull(message = "Çevrim numarası (cycle number) boş bırakılamaz")
    private Long cycleNumber;
}