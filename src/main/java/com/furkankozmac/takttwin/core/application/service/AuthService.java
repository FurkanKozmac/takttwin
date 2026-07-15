package com.furkankozmac.takttwin.core.application.service;

import com.furkankozmac.takttwin.core.application.port.PasswordPort;
import com.furkankozmac.takttwin.core.application.port.RefreshTokenPort;
import com.furkankozmac.takttwin.core.application.port.UserPort;
import com.furkankozmac.takttwin.core.domain.exception.EntityNotFoundException;
import com.furkankozmac.takttwin.core.domain.model.RefreshToken;
import com.furkankozmac.takttwin.core.domain.model.User;

import java.time.LocalDateTime;
import java.util.UUID;


public class AuthService {

    private final UserPort userPort;
    private final RefreshTokenPort refreshTokenPort;
    private final PasswordPort passwordPort;

    public AuthService(UserPort userPort, RefreshTokenPort refreshTokenPort, PasswordPort passwordPort){
        this.userPort = userPort;
        this.refreshTokenPort = refreshTokenPort;
        this.passwordPort = passwordPort;
    }

    public User register(User user) {
        if(userPort.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("Email already exists!");
        }

        user.setPassword(passwordPort.hash(user.getPassword()));
        return userPort.save(user);
    }

    public User authenticate(String email, String rawPassword) {
        User user = userPort.findByEmail(email).orElseThrow(() -> new EntityNotFoundException("User with email:" + email + " not found."));

        if (!passwordPort.matches(rawPassword, user.getPassword())) {
            throw new IllegalArgumentException("Wrong password.");
        }

        return user;
    }

    public RefreshToken createRefreshToken(String email) {
        User user = userPort.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + email));

        refreshTokenPort.deleteByUser(user.getId());

        RefreshToken refreshToken = RefreshToken.builder()
                .token(UUID.randomUUID().toString())
                .expiryDate(LocalDateTime.now().plusDays(7))
                .user(user)
                .build();

        return refreshTokenPort.save(refreshToken);
    }

    public RefreshToken verifyAndRefreshToken(String token) {
        RefreshToken refreshToken = refreshTokenPort.findByToken(token)
                .orElseThrow(() -> new EntityNotFoundException("Invalid session key (Refresh Token)"));

        if (refreshToken.isExpired()) {
            refreshTokenPort.deleteByUser(refreshToken.getUser().getId());
            throw new IllegalArgumentException("Session expired. Please login again.");
        }

        return refreshToken;
    }
}
