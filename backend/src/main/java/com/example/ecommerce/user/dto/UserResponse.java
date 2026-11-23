package com.example.ecommerce.user.dto;

import com.example.ecommerce.user.model.Role;

public record UserResponse(Long id, String email, String fullName, Role role) {}
