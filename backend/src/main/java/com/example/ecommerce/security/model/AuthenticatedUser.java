package com.example.ecommerce.security.model;

import com.example.ecommerce.user.model.Role;

/** Principal placed in the SecurityContext after a valid access token. */
public record AuthenticatedUser(Long id, String email, Role role) {
}
