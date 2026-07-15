package com.furkankozmac.takttwin.core.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshToken {
    private Long id;
    private String token;
    private LocalDateTime expiryDate;
    private User user;

    public boolean isExpired() {
        return expiryDate.isBefore(LocalDateTime.now());
    }
}