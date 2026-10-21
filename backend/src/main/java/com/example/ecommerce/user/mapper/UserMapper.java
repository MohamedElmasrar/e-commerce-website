package com.example.ecommerce.user.mapper;

import com.example.ecommerce.user.dto.UserResponse;
import com.example.ecommerce.user.model.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserResponse toResponse(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getFullName(), user.getRole());
    }
}
