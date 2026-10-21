package com.example.ecommerce.user.service;

import com.example.ecommerce.auth.repository.RefreshTokenRepository;
import com.example.ecommerce.common.exception.BusinessRuleException;
import com.example.ecommerce.common.exception.NotFoundException;
import com.example.ecommerce.user.model.User;
import com.example.ecommerce.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public User getById(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new NotFoundException("User not found"));
    }

    @Transactional
    public User updateProfile(Long id, String fullName) {
        User user = getById(id);
        user.setFullName(fullName.trim());
        return user;
    }

    @Transactional
    public void changePassword(Long id, String currentPassword, String newPassword) {
        User user = getById(id);
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new BusinessRuleException("Current password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        refreshTokenRepository.revokeAllForUser(id);
    }
}
