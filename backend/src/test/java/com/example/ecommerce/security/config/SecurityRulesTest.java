package com.example.ecommerce.security.config;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.ecommerce.common.exception.GlobalExceptionHandler;
import com.example.ecommerce.common.filter.RequestIdFilter;
import com.example.ecommerce.config.properties.CorsProperties;
import com.example.ecommerce.config.properties.JwtProperties;
import com.example.ecommerce.security.service.JwtService;
import com.example.ecommerce.user.controller.UserController;
import com.example.ecommerce.user.mapper.UserMapper;
import com.example.ecommerce.user.model.Role;
import com.example.ecommerce.user.model.User;
import com.example.ecommerce.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/** Verifies the URL security rules without a database. */
@WebMvcTest(UserController.class)
@ActiveProfiles("test")
@EnableConfigurationProperties({JwtProperties.class, CorsProperties.class})
@Import({SecurityConfig.class, JwtService.class, GlobalExceptionHandler.class, RequestIdFilter.class, UserMapper.class})
class SecurityRulesTest {

    @Autowired MockMvc mvc;
    @Autowired JwtService jwtService;
    @MockBean UserService userService;

    private String token(Role role) {
        User u = User.builder().email("x@example.com").passwordHash("h").fullName("X").role(role).build();
        u.setId(1L);
        return "Bearer " + jwtService.generateAccessToken(u);
    }

    @Test
    void adminEndpointWithoutTokenIs401WithApiErrorBody() throws Exception {
        mvc.perform(get("/api/v1/admin/anything"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.path").value("/api/v1/admin/anything"));
    }

    @Test
    void adminEndpointAsCustomerIs403() throws Exception {
        mvc.perform(get("/api/v1/admin/anything").header("Authorization", token(Role.CUSTOMER)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    void adminEndpointAsAdminPassesSecurity() throws Exception {
        mvc.perform(get("/api/v1/admin/anything").header("Authorization", token(Role.ADMIN)))
                .andExpect(status().isNotFound());
    }

    @Test
    void meWithoutTokenIs401() throws Exception {
        mvc.perform(get("/api/v1/users/me")).andExpect(status().isUnauthorized());
    }

    @Test
    void invalidTokenIs401() throws Exception {
        mvc.perform(get("/api/v1/users/me").header("Authorization", "Bearer junk"))
                .andExpect(status().isUnauthorized());
    }
}
