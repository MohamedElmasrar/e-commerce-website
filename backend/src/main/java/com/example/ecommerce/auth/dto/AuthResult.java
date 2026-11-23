package com.example.ecommerce.auth.dto;

/**
 * Service result: the JSON body plus the raw refresh token that the controller sets as a cookie.
 */
public record AuthResult(AuthResponse response, String refreshToken) {}
