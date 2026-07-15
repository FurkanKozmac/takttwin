package com.furkankozmac.takttwin.core.application.port;

public interface PasswordPort {
    String hash(String rawPassword);
    boolean matches(String rawPassword, String hashedPassword);
}
