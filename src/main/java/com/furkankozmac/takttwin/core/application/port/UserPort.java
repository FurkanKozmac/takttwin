package com.furkankozmac.takttwin.core.application.port;

import com.furkankozmac.takttwin.core.domain.model.User;
import java.util.Optional;

public interface UserPort {
    User save(User user);
    Optional<User> findByEmail(String email);
    Optional<User> findById(Long id);
    boolean existsByEmail(String email);
}