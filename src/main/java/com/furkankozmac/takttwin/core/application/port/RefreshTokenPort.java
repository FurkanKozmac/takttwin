package com.furkankozmac.takttwin.core.application.port;

import com.furkankozmac.takttwin.core.domain.model.RefreshToken;
import java.util.Optional;

public interface RefreshTokenPort {
    RefreshToken save(RefreshToken refreshToken);
    Optional<RefreshToken> findByToken(String token);
    void deleteByUser(Long userId);
}