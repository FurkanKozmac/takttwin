package com.furkankozmac.takttwin.infrastructure.web.dto;

import com.furkankozmac.takttwin.core.domain.model.WorkType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkElementCreateRequest {

    @NotBlank(message = "Eleman iş adı boş olamaz")
    private String name;

    @Positive(message = "Standart süre sıfırdan büyük olmalıdır")
    private Double standardDuration;

    @NotNull(message = "İş tipi (MANUAL, WALKING, MACHINE, WAITING) boş bırakılamaz")
    private WorkType workType;

    private boolean isValueAdded;
}