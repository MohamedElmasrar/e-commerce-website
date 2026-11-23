package com.example.ecommerce.auth.dto;

import com.example.ecommerce.user.dto.UserResponse;

public record AuthResponse(
        String accessToken, String tokenType, long expiresIn, UserResponse user) {}
