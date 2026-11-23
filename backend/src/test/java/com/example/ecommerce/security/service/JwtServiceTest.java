package com.example.ecommerce.security.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.example.ecommerce.config.properties.JwtProperties;
import com.example.ecommerce.security.model.AuthenticatedUser;
import com.example.ecommerce.user.model.Role;
import com.example.ecommerce.user.model.User;
import java.time.Duration;
import org.junit.jupiter.api.Test;

class JwtServiceTest {

    private static final String SECRET = "unit-test-secret-unit-test-secret-1234567890";

    private JwtService service(String secret, Duration ttl) {
        return new JwtService(
                new JwtProperties(secret, "ecommerce", ttl, Duration.ofDays(7), false));
    }

    private User user() {
        User u =
                User.builder()
                        .email("a@b.com")
                        .passwordHash("x")
                        .fullName("A")
                        .role(Role.ADMIN)
                        .build();
        u.setId(42L);
        return u;
    }

    @Test
    void roundTripsClaims() {
        JwtService jwt = service(SECRET, Duration.ofMinutes(15));
        AuthenticatedUser principal = jwt.parse(jwt.generateAccessToken(user())).orElseThrow();
        assertThat(principal).isEqualTo(new AuthenticatedUser(42L, "a@b.com", Role.ADMIN));
    }

    @Test
    void rejectsExpiredToken() {
        JwtService jwt = service(SECRET, Duration.ofSeconds(-5));
        assertThat(jwt.parse(jwt.generateAccessToken(user()))).isEmpty();
    }

    @Test
    void rejectsTokenSignedWithOtherKey() {
        String token =
                service("another-secret-another-secret-1234567890", Duration.ofMinutes(5))
                        .generateAccessToken(user());
        assertThat(service(SECRET, Duration.ofMinutes(5)).parse(token)).isEmpty();
    }

    @Test
    void rejectsGarbage() {
        assertThat(service(SECRET, Duration.ofMinutes(5)).parse("not-a-jwt")).isEmpty();
    }

    @Test
    void rejectsShortSecret() {
        assertThatThrownBy(() -> service("short", Duration.ofMinutes(5)))
                .isInstanceOf(IllegalStateException.class);
    }
}
