package com.example.ecommerce;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Boots the full app against PostgreSQL. Flyway migrates and Hibernate ddl-auto=validate runs.
 * Skipped automatically when Docker is not available.
 */
@Testcontainers(disabledWithoutDocker = true)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class BackendIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Autowired TestRestTemplate rest;
    @Autowired JdbcTemplate jdbc;

    private HttpEntity<Object> bearer(String token) {
        HttpHeaders h = new HttpHeaders();
        h.setBearerAuth(token);
        return new HttpEntity<>(h);
    }

    @Test
    void migrationsSeedAndHealth() {
        assertThat(jdbc.queryForObject("select count(*) from products", Integer.class)).isGreaterThanOrEqualTo(30);
        assertThat(jdbc.queryForObject("select count(*) from categories", Integer.class)).isGreaterThanOrEqualTo(6);
        assertThat(rest.getForObject("/actuator/health", JsonNode.class).get("status").asText()).isEqualTo("UP");
        assertThat(rest.getForEntity("/swagger-ui.html", String.class).getStatusCode().is3xxRedirection()
                || rest.getForEntity("/v3/api-docs", String.class).getStatusCode().is2xxSuccessful()).isTrue();
    }

    @Test
    void registerLoginMeRefreshLogoutFlow() {
        Map<String, String> reg = Map.of("email", "flow@example.com", "password", "password123", "fullName", "Flow");
        ResponseEntity<JsonNode> registered = rest.postForEntity("/api/v1/auth/register", reg, JsonNode.class);
        assertThat(registered.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(rest.postForEntity("/api/v1/auth/register", reg, JsonNode.class).getStatusCode())
                .isEqualTo(HttpStatus.CONFLICT);

        ResponseEntity<JsonNode> login = rest.postForEntity("/api/v1/auth/login",
                Map.of("email", "flow@example.com", "password", "password123"), JsonNode.class);
        assertThat(login.getStatusCode()).isEqualTo(HttpStatus.OK);
        String access = login.getBody().get("accessToken").asText();
        String setCookie = login.getHeaders().getFirst(HttpHeaders.SET_COOKIE);
        assertThat(setCookie).contains("refresh_token=").contains("HttpOnly");
        String cookie = setCookie.substring(0, setCookie.indexOf(';'));

        ResponseEntity<JsonNode> me = rest.exchange("/api/v1/users/me", HttpMethod.GET, bearer(access), JsonNode.class);
        assertThat(me.getBody().get("email").asText()).isEqualTo("flow@example.com");

        HttpHeaders withCookie = new HttpHeaders();
        withCookie.add(HttpHeaders.COOKIE, cookie);
        ResponseEntity<JsonNode> refreshed = rest.exchange("/api/v1/auth/refresh", HttpMethod.POST,
                new HttpEntity<>(withCookie), JsonNode.class);
        assertThat(refreshed.getStatusCode()).isEqualTo(HttpStatus.OK);
        // old refresh token was rotated
        assertThat(rest.exchange("/api/v1/auth/refresh", HttpMethod.POST, new HttpEntity<>(withCookie), JsonNode.class)
                .getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);

        String newCookie = refreshed.getHeaders().getFirst(HttpHeaders.SET_COOKIE);
        HttpHeaders second = new HttpHeaders();
        second.add(HttpHeaders.COOKIE, newCookie.substring(0, newCookie.indexOf(';')));
        assertThat(rest.exchange("/api/v1/auth/logout", HttpMethod.POST, new HttpEntity<>(second), Void.class)
                .getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(rest.exchange("/api/v1/auth/refresh", HttpMethod.POST, new HttpEntity<>(second), JsonNode.class)
                .getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void adminEndpointsRequireAdminRole() {
        assertThat(rest.getForEntity("/api/v1/admin/x", JsonNode.class).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
        String token = rest.postForEntity("/api/v1/auth/login",
                Map.of("email", "customer@example.com", "password", "Customer123!"), JsonNode.class)
                .getBody().get("accessToken").asText();
        assertThat(rest.exchange("/api/v1/admin/x", HttpMethod.GET, bearer(token), JsonNode.class).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
        String admin = rest.postForEntity("/api/v1/auth/login",
                Map.of("email", "admin@example.com", "password", "Admin123!"), JsonNode.class)
                .getBody().get("accessToken").asText();
        assertThat(rest.exchange("/api/v1/admin/x", HttpMethod.GET, bearer(admin), JsonNode.class).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
