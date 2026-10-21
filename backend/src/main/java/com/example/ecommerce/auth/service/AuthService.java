package com.example.ecommerce.auth.service;

import com.example.ecommerce.auth.dto.AuthResponse;
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
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final UserMapper userMapper;

    @Transactional
    public AuthResult register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("Email is already registered");
        }
        User user = userRepository.save(User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(request.password()))
                .fullName(request.fullName().trim())
                .role(Role.CUSTOMER)
                .build());
        return issue(user);
    }

    @Transactional
    public AuthResult login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.email().trim())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }
        if (!user.isEnabled()) {
            throw new DisabledException("Account is disabled");
        }
        return issue(user);
    }

    /** Rotates the refresh token: the presented token is revoked and a new one is issued. */
    @Transactional
    public AuthResult refresh(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new BadCredentialsException("Invalid refresh token");
        }
        RefreshToken stored = refreshTokenRepository.findByTokenHash(hash(rawToken))
                .orElseThrow(() -> new BadCredentialsException("Invalid refresh token"));
        if (stored.isRevoked() || stored.getExpiresAt().isBefore(Instant.now())) {
            throw new BadCredentialsException("Invalid refresh token");
        }
        User user = userRepository.findById(stored.getUserId())
                .filter(User::isEnabled)
                .orElseThrow(() -> new BadCredentialsException("Invalid refresh token"));
        stored.setRevoked(true);
        return issue(user);
    }

    @Transactional
    public void logout(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return;
        }
        refreshTokenRepository.findByTokenHash(hash(rawToken)).ifPresent(t -> t.setRevoked(true));
    }

    private AuthResult issue(User user) {
        byte[] bytes = new byte[48];
        RANDOM.nextBytes(bytes);
        String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        refreshTokenRepository.save(RefreshToken.builder()
                .userId(user.getId())
                .tokenHash(hash(raw))
                .expiresAt(Instant.now().plus(jwtProperties.refreshTokenTtl()))
                .build());
        AuthResponse body = new AuthResponse(jwtService.generateAccessToken(user), "Bearer",
                jwtService.accessTokenTtlSeconds(), userMapper.toResponse(user));
        return new AuthResult(body, raw);
    }

    static String hash(String raw) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
