package com.example.ecommerce.product.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record ProductResponse(Long id, String sku, String slug, String name, String description,
                              BigDecimal price, String currency, boolean active, CategorySummary category,
                              List<ImageResponse> images, boolean inStock, Instant createdAt) {

    public record CategorySummary(Long id, String name, String slug) {
    }

    public record ImageResponse(Long id, String url, int position) {
    }
}
