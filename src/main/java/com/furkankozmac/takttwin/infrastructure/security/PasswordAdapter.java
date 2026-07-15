package com.furkankozmac.takttwin.infrastructure.security;

import com.furkankozmac.takttwin.core.application.port.PasswordPort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class PasswordAdapter implements PasswordPort {

    private final PasswordEncoder passwordEncoder;

    // SecurityConfig içindeki BCryptPasswordEncoder'ı enjekte ediyoruz
    public PasswordAdapter(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public String hash(String rawPassword) {
        return passwordEncoder.encode(rawPassword);
    }

    @Override
    public boolean matches(String rawPassword, String hashedPassword) {
        return passwordEncoder.matches(rawPassword, hashedPassword);
    }
}