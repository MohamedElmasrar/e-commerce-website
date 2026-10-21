package com.example.ecommerce.product.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.ecommerce.common.dto.PageResponse;
import com.example.ecommerce.common.exception.BadRequestException;
import com.example.ecommerce.common.exception.GlobalExceptionHandler;
import com.example.ecommerce.common.filter.RequestIdFilter;
import com.example.ecommerce.config.properties.CorsProperties;
import com.example.ecommerce.config.properties.JwtProperties;
import com.example.ecommerce.product.dto.ProductResponse;
import com.example.ecommerce.product.service.ProductService;
import com.example.ecommerce.product.specification.ProductFilter;
import com.example.ecommerce.security.config.SecurityConfig;
import com.example.ecommerce.security.service.JwtService;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(ProductController.class)
@ActiveProfiles("test")
@EnableConfigurationProperties({JwtProperties.class, CorsProperties.class})
@Import({SecurityConfig.class, JwtService.class, GlobalExceptionHandler.class, RequestIdFilter.class})
class ProductControllerTest {

    @Autowired MockMvc mvc;
    @MockBean ProductService productService;

    @Test
    void listIsPublicAndPassesFiltersPagingAndSort() throws Exception {
        ProductResponse product = new ProductResponse(1L, "TEA", "tea", "Tea", null,
                new BigDecimal("3.00"), "USD", true, null, List.of(), true, Instant.EPOCH);
        when(productService.search(any(), eq(2), eq(12), eq("price,asc")))
                .thenReturn(new PageResponse<>(List.of(product), 2, 12, 25, 3));

        mvc.perform(get("/api/v1/products?page=2&size=12&sort=price,asc&q=tea&category=drinks"
                        + "&minPrice=1.50&maxPrice=9&inStock=true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(2))
                .andExpect(jsonPath("$.content[0].inStock").value(true))
                .andExpect(jsonPath("$.content[0].stock").doesNotHaveJsonPath());

        ArgumentCaptor<ProductFilter> f = ArgumentCaptor.forClass(ProductFilter.class);
        verify(productService).search(f.capture(), eq(2), eq(12), eq("price,asc"));
        org.assertj.core.api.Assertions.assertThat(f.getValue()).isEqualTo(
                new ProductFilter("tea", null, "drinks", new BigDecimal("1.50"), new BigDecimal("9"), true, false));
    }

    @Test
    void detailShowsAvailabilityWithoutStockCount() throws Exception {
        when(productService.getBySlug("tea")).thenReturn(new ProductResponse(1L, "TEA", "tea", "Tea", null,
                new BigDecimal("3.00"), "USD", true, null, List.of(), false, Instant.EPOCH));

        mvc.perform(get("/api/v1/products/tea"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.inStock").value(false))
                .andExpect(jsonPath("$.stock").doesNotHaveJsonPath());
    }

    @Test
    void badSortIs400() throws Exception {
        when(productService.search(any(), eq(0), eq(12), eq("secret,asc")))
                .thenThrow(new BadRequestException("Unsupported sort field"));
        mvc.perform(get("/api/v1/products?sort=secret,asc")).andExpect(status().isBadRequest());
    }
}
