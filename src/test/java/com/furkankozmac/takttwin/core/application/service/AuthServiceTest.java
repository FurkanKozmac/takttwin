package com.furkankozmac.takttwin.core.application.service;

import com.furkankozmac.takttwin.core.application.port.PasswordPort;
import com.furkankozmac.takttwin.core.application.port.RefreshTokenPort;
import com.furkankozmac.takttwin.core.application.port.UserPort;
import com.furkankozmac.takttwin.core.domain.model.RefreshToken;
import com.furkankozmac.takttwin.core.domain.model.Role;
import com.furkankozmac.takttwin.core.domain.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserPort userPort;
    @Mock
    private RefreshTokenPort refreshTokenPort;
    @Mock
    private PasswordPort passwordPort;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        // Servisimizi mock'lanmış portlarla ayağa kaldırıyoruz (Saf Java Testi!)
        authService = new AuthService(userPort, refreshTokenPort, passwordPort);
    }

    @Test
    @DisplayName("Yeni kullanıcı kaydı başarılı olmalı ve şifreyi hashlemeli")
    void shouldRegisterUserSuccessfully() {
        // GIVEN (Hazırlık)
        User rawUser = User.builder()
                .email("test@example.com")
                .password("rawPassword")
                .role(Role.ROLE_TEAM_LEADER)
                .build();

        when(userPort.existsByEmail(rawUser.getEmail())).thenReturn(false);
        when(passwordPort.hash(rawUser.getPassword())).thenReturn("hashedPassword");
        when(userPort.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // WHEN (Çalıştırma)
        User registeredUser = authService.register(rawUser);

        // THEN (Doğrulama)
        assertNotNull(registeredUser);
        assertEquals("test@example.com", registeredUser.getEmail());
        assertEquals("hashedPassword", registeredUser.getPassword()); // Şifrenin hash'lendiğini doğruluyoruz
        assertEquals(Role.ROLE_TEAM_LEADER, registeredUser.getRole());

        verify(passwordPort, times(1)).hash("rawPassword");
        verify(userPort, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("Kayıt olurken e-posta adresi zaten varsa IllegalArgumentException fırlatmalı")
    void shouldThrowExceptionWhenRegisteringWithExistingEmail() {
        // GIVEN
        User rawUser = User.builder().email("existing@example.com").password("password").build();
        when(userPort.existsByEmail(rawUser.getEmail())).thenReturn(true);

        // WHEN & THEN (Çalıştırma ve Hata Doğrulama)
        assertThrows(IllegalArgumentException.class, () -> authService.register(rawUser));

        verify(passwordPort, never()).hash(anyString());
        verify(userPort, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Doğru kullanıcı adı ve şifreyle giriş başarılı olmalı")
    void shouldAuthenticateUserSuccessfully() {
        // GIVEN
        String email = "test@example.com";
        String rawPassword = "password";
        User dbUser = User.builder().email(email).password("hashedPassword").build();

        when(userPort.findByEmail(email)).thenReturn(Optional.of(dbUser));
        when(passwordPort.matches(rawPassword, "hashedPassword")).thenReturn(true);

        // WHEN
        User result = authService.authenticate(email, rawPassword);

        // THEN
        assertNotNull(result);
        assertEquals(email, result.getEmail());
        verify(passwordPort, times(1)).matches(rawPassword, "hashedPassword");
    }

    @Test
    @DisplayName("Giriş yaparken şifre hatalıysa IllegalArgumentException fırlatmalı")
    void shouldThrowExceptionWhenPasswordIsIncorrect() {
        // GIVEN
        String email = "test@example.com";
        String rawPassword = "wrongPassword";
        User dbUser = User.builder().email(email).password("hashedPassword").build();

        when(userPort.findByEmail(email)).thenReturn(Optional.of(dbUser));
        when(passwordPort.matches(rawPassword, "hashedPassword")).thenReturn(false);

        // WHEN & THEN
        assertThrows(IllegalArgumentException.class, () -> authService.authenticate(email, rawPassword));
    }

    @Test
    @DisplayName("Yeni refresh token oluştururken eski tokenları silip yenisini kaydetmeli")
    void shouldCreateRefreshTokenSuccessfully() {
        // GIVEN
        String email = "test@example.com";
        User user = User.builder().id(1L).email(email).build();

        when(userPort.findByEmail(email)).thenReturn(Optional.of(user));
        when(refreshTokenPort.save(any(RefreshToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // WHEN
        RefreshToken createdToken = authService.createRefreshToken(email);

        // THEN
        assertNotNull(createdToken);
        assertNotNull(createdToken.getToken());
        assertTrue(createdToken.getExpiryDate().isAfter(LocalDateTime.now()));
        assertEquals(user, createdToken.getUser());

        // Eski aktif token'ların silindiğini doğruluyoruz
        verify(refreshTokenPort, times(1)).deleteByUser(1L);
        verify(refreshTokenPort, times(1)).save(any(RefreshToken.class));
    }

    @Test
    @DisplayName("Refresh token süresi dolmuşsa token'ı veritabanından silmeli ve hata fırlatmalı")
    void shouldDeleteTokenAndThrowExceptionWhenRefreshTokenIsExpired() {
        // GIVEN
        String tokenString = "expired-token-uuid";
        User user = User.builder().id(1L).email("test@example.com").build();
        RefreshToken expiredToken = RefreshToken.builder()
                .token(tokenString)
                .expiryDate(LocalDateTime.now().minusSeconds(1)) // Süresi 1 saniye önce dolmuş
                .user(user)
                .build();

        when(refreshTokenPort.findByToken(tokenString)).thenReturn(Optional.of(expiredToken));

        // WHEN & THEN
        assertThrows(IllegalArgumentException.class, () -> authService.verifyAndRefreshToken(tokenString));

        // Süresi dolmuş token'ın veritabanından silindiğini doğruluyoruz (İptal Güvenliği!)
        verify(refreshTokenPort, times(1)).deleteByUser(1L);
    }
}