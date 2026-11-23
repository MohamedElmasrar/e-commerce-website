package com.example.ecommerce.admin.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.ecommerce.admin.dto.DashboardStats;
import com.example.ecommerce.admin.service.DashboardService;
import com.example.ecommerce.category.controller.AdminCategoryController;
import com.example.ecommerce.category.service.CategoryService;
import com.example.ecommerce.common.exception.GlobalExceptionHandler;
import com.example.ecommerce.common.filter.RequestIdFilter;
import com.example.ecommerce.config.properties.CorsProperties;
import com.example.ecommerce.config.properties.JwtProperties;
import com.example.ecommerce.inventory.controller.AdminInventoryController;
import com.example.ecommerce.inventory.repository.InventoryRepository;
import com.example.ecommerce.inventory.service.InventoryService;
import com.example.ecommerce.order.controller.AdminOrderController;
import com.example.ecommerce.order.service.OrderService;
import com.example.ecommerce.product.controller.AdminProductController;
import com.example.ecommerce.product.dto.AdminProductResponse;
import com.example.ecommerce.product.dto.ProductResponse;
import com.example.ecommerce.product.service.ProductService;
import com.example.ecommerce.security.config.SecurityConfig;
import com.example.ecommerce.security.service.JwtService;
import com.example.ecommerce.user.model.Role;
import com.example.ecommerce.user.model.User;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/** Every admin controller must reject anonymous (401) and customer (403) callers. */
@WebMvcTest({
    AdminDashboardController.class,
    AdminCategoryController.class,
    AdminProductController.class,
    AdminOrderController.class,
    AdminInventoryController.class
})
@ActiveProfiles("test")
@EnableConfigurationProperties({JwtProperties.class, CorsProperties.class})
@Import({
    SecurityConfig.class,
    JwtService.class,
    GlobalExceptionHandler.class,
    RequestIdFilter.class
})
class AdminAuthorizationTest {

    private static final List<String> ADMIN_GETS =
            List.of(
                    "/api/v1/admin/dashboard/stats",
                    "/api/v1/admin/products",
                    "/api/v1/admin/products/1",
                    "/api/v1/admin/orders",
                    "/api/v1/admin/inventory");

    @Autowired MockMvc mvc;
    @Autowired JwtService jwtService;
    @MockBean DashboardService dashboardService;
    @MockBean CategoryService categoryService;
    @MockBean ProductService productService;
    @MockBean OrderService orderService;
    @MockBean InventoryService inventoryService;
    @MockBean InventoryRepository inventoryRepository;

    private String token(Role role) {
        User u =
                User.builder()
                        .email("x@example.com")
                        .passwordHash("h")
                        .fullName("X")
                        .role(role)
                        .build();
        u.setId(1L);
        return "Bearer " + jwtService.generateAccessToken(u);
    }

    @Test
    void anonymousGets401() throws Exception {
        for (String url : ADMIN_GETS) {
            mvc.perform(get(url)).andExpect(status().isUnauthorized());
        }
    }

    @Test
    void customerGets403() throws Exception {
        for (String url : ADMIN_GETS) {
            mvc.perform(get(url).header("Authorization", token(Role.CUSTOMER)))
                    .andExpect(status().isForbidden());
        }
    }

    @Test
    void adminCanReadDashboard() throws Exception {
        when(dashboardService.stats())
                .thenReturn(
                        new DashboardStats(
                                BigDecimal.ZERO, 0, Map.of(), 0, 0, List.of(), List.of()));
        mvc.perform(get("/api/v1/admin/dashboard/stats").header("Authorization", token(Role.ADMIN)))
                .andExpect(status().isOk());
    }

    @Test
    void adminCanReadExactProductStock() throws Exception {
        ProductResponse product =
                new ProductResponse(
                        1L,
                        "TEA",
                        "tea",
                        "Tea",
                        null,
                        new BigDecimal("3.00"),
                        "USD",
                        true,
                        null,
                        List.of(),
                        true,
                        Instant.EPOCH);
        when(productService.getById(1L)).thenReturn(new AdminProductResponse(product, 17));

        mvc.perform(get("/api/v1/admin/products/1").header("Authorization", token(Role.ADMIN)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stock").value(17))
                .andExpect(jsonPath("$.inStock").value(true));
    }
}
