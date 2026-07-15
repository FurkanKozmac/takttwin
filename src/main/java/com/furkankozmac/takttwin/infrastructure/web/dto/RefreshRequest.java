package com.furkankozmac.takttwin.infrastructure.web.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshRequest {

    @NotBlank(message = "Refresh token can't be empty!")
    private String refreshToken;
}