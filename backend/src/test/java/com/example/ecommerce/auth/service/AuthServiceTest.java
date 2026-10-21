package com.example.ecommerce.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.ecommerce.auth.dto.AuthResult;
import com.example.ecommerce.auth.dto.LoginRequest;
import com.example.ecommerce.auth.dto.RegisterRequest;
import com.example.ecommerce.auth.model.RefreshToken;
import com.example.ecommerce.auth.repository.RefreshTokenRepository;
import com.example.ecommerce.common.exception.ConflictException;
import com.example.ecommerce.config.properties.JwtProperties;
import com.example.ecommerce.security.service.JwtService;
import com.example.ecommerce.user.mapper.UserMapper;
import com.example.ecommerce.user.model.Role;
import com.example.ecommerce.user.model.User;
import com.example.ecommerce.user.repository.UserRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock RefreshTokenRepository refreshTokenRepository;

    private final PasswordEncoder encoder = new BCryptPasswordEncoder(4);
    private final JwtProperties props =
            new JwtProperties("unit-test-secret-unit-test-secret-1234567890", "ecommerce",
                    Duration.ofMinutes(15), Duration.ofDays(7), false);
    private AuthService service;

    @BeforeEach
    void setUp() {
        service = new AuthService(userRepository, refreshTokenRepository, encoder,
                new JwtService(props), props, new UserMapper());
    }

    private User savedUser(String password) {
        User u = User.builder().email("jane@example.com").passwordHash(encoder.encode(password))
                .fullName("Jane").role(Role.CUSTOMER).build();
        u.setId(7L);
        return u;
    }

    @Test
    void registerCreatesCustomerWithHashedPasswordAndNormalizedEmail() {
        when(userRepository.existsByEmailIgnoreCase("jane@example.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(7L);
            return u;
        });

        AuthResult result = service.register(new RegisterRequest(" Jane@Example.com ", "password123", " Jane "));

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();
        assertThat(saved.getEmail()).isEqualTo("jane@example.com");
        assertThat(saved.getRole()).isEqualTo(Role.CUSTOMER);
        assertThat(saved.getPasswordHash()).isNotEqualTo("password123");
        assertThat(encoder.matches("password123", saved.getPasswordHash())).isTrue();
        assertThat(result.response().accessToken()).isNotBlank();
        assertThat(result.refreshToken()).isNotBlank();
    }

    @Test
    void registerRejectsDuplicateEmail() {
        when(userRepository.existsByEmailIgnoreCase("jane@example.com")).thenReturn(true);
        assertThatThrownBy(() -> service.register(new RegisterRequest("jane@example.com", "password123", "Jane")))
                .isInstanceOf(ConflictException.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    void loginSucceedsWithCorrectPassword() {
        when(userRepository.findByEmailIgnoreCase("jane@example.com")).thenReturn(Optional.of(savedUser("secret-pass")));
        AuthResult result = service.login(new LoginRequest("jane@example.com", "secret-pass"));
        assertThat(result.response().user().email()).isEqualTo("jane@example.com");
        assertThat(result.response().tokenType()).isEqualTo("Bearer");
    }

    @Test
    void loginRejectsWrongPasswordAndUnknownEmail() {
        when(userRepository.findByEmailIgnoreCase("jane@example.com")).thenReturn(Optional.of(savedUser("secret-pass")));
        when(userRepository.findByEmailIgnoreCase("nobody@example.com")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.login(new LoginRequest("jane@example.com", "wrong")))
                .isInstanceOf(BadCredentialsException.class);
        assertThatThrownBy(() -> service.login(new LoginRequest("nobody@example.com", "x")))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void refreshRotatesToken() {
        User user = savedUser("pw");
        RefreshToken stored = RefreshToken.builder().userId(7L).tokenHash(AuthService.hash("raw"))
                .expiresAt(Instant.now().plusSeconds(60)).build();
        when(refreshTokenRepository.findByTokenHash(AuthService.hash("raw"))).thenReturn(Optional.of(stored));
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));

        AuthResult result = service.refresh("raw");

        assertThat(stored.isRevoked()).isTrue();
        assertThat(result.refreshToken()).isNotEqualTo("raw");
    }

    @Test
    void refreshRejectsRevokedExpiredAndUnknownTokens() {
        RefreshToken revoked = RefreshToken.builder().userId(7L).tokenHash("h").revoked(true)
                .expiresAt(Instant.now().plusSeconds(60)).build();
        RefreshToken expired = RefreshToken.builder().userId(7L).tokenHash("h")
                .expiresAt(Instant.now().minusSeconds(60)).build();
        when(refreshTokenRepository.findByTokenHash(AuthService.hash("revoked"))).thenReturn(Optional.of(revoked));
        when(refreshTokenRepository.findByTokenHash(AuthService.hash("expired"))).thenReturn(Optional.of(expired));
        when(refreshTokenRepository.findByTokenHash(AuthService.hash("unknown"))).thenReturn(Optional.empty());

        for (String t : new String[] {"revoked", "expired", "unknown", "", null}) {
            assertThatThrownBy(() -> service.refresh(t)).isInstanceOf(BadCredentialsException.class);
        }
    }

    @Test
    void logoutRevokesToken() {
        RefreshToken stored = RefreshToken.builder().userId(7L).tokenHash("h")
                .expiresAt(Instant.now().plusSeconds(60)).build();
        when(refreshTokenRepository.findByTokenHash(AuthService.hash("raw"))).thenReturn(Optional.of(stored));
        service.logout("raw");
        assertThat(stored.isRevoked()).isTrue();
        service.logout(null);
    }
}
