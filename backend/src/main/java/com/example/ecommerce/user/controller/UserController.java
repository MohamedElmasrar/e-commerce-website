package com.example.ecommerce.user.controller;

import com.example.ecommerce.security.model.AuthenticatedUser;
import com.example.ecommerce.user.dto.ChangePasswordRequest;
import com.example.ecommerce.user.dto.UpdateProfileRequest;
import com.example.ecommerce.user.dto.UserResponse;
import com.example.ecommerce.user.mapper.UserMapper;
import com.example.ecommerce.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users/me")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserMapper userMapper;

    @GetMapping
    public UserResponse me(@AuthenticationPrincipal AuthenticatedUser principal) {
        return userMapper.toResponse(userService.getById(principal.id()));
    }

    @PutMapping
    public UserResponse update(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @Valid @RequestBody UpdateProfileRequest request) {
        return userMapper.toResponse(userService.updateProfile(principal.id(), request.fullName()));
    }

    @PutMapping("/password")
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(
                principal.id(), request.currentPassword(), request.newPassword());
        return ResponseEntity.noContent().build();
    }
}
