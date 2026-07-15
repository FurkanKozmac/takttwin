package com.furkankozmac.takttwin.infrastructure.web.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResolveAlertRequest {
    @NotBlank(message = "Çözüm açıklaması boş olamaz")
    private String comment;
}