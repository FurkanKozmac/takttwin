package com.furkankozmac.takttwin.infrastructure.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StationCreateRequest {

    @NotBlank(message = "Station name cannot be blank!")
    private String name;

    @Positive
    private Double taktTime;
}
