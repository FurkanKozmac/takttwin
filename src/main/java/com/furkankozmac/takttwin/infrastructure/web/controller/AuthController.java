package com.furkankozmac.takttwin.infrastructure.web.controller;

import com.furkankozmac.takttwin.core.application.service.AuthService;
import com.furkankozmac.takttwin.core.domain.model.RefreshToken;
import com.furkankozmac.takttwin.core.domain.model.User;
import com.furkankozmac.takttwin.infrastructure.security.JwtService;
import com.furkankozmac.takttwin.infrastructure.web.dto.LoginRequest;
import com.furkankozmac.takttwin.infrastructure.web.dto.LoginResponse;
import com.furkankozmac.takttwin.infrastructure.web.dto.RegisterRequest;
import com.furkankozmac.takttwin.infrastructure.web.dto.RefreshRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;

    public AuthController(AuthService authService, JwtService jwtService) {
        this.authService = authService;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public ResponseEntity<User> register(@Valid @RequestBody RegisterRequest request) {
        User domainUser = User.builder()
                .email(request.getEmail())
                .password(request.getPassword())
                .role(request.getRole())
                .build();

        User registeredUser = authService.register(domainUser);
        return ResponseEntity.ok(registeredUser);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {

        User authenticatedUser = authService.authenticate(request.getEmail(), request.getPassword());

        String accessToken = jwtService.generateToken(authenticatedUser.getEmail(), authenticatedUser.getRole().name());

        RefreshToken refreshToken = authService.createRefreshToken(authenticatedUser.getEmail());

        LoginResponse response = LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .email(authenticatedUser.getEmail())
                .role(authenticatedUser.getRole().name())
                .build();

        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(@Valid @RequestBody RefreshRequest request) {

        RefreshToken verifiedToken = authService.verifyAndRefreshToken(request.getRefreshToken());

        User user = verifiedToken.getUser();
        String newAccessToken = jwtService.generateToken(user.getEmail(), user.getRole().name());

        LoginResponse response = LoginResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(verifiedToken.getToken())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();

        return ResponseEntity.ok(response);
    }
}