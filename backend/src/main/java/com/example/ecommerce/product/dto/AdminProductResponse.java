package com.example.ecommerce.product.dto;

import com.example.ecommerce.product.dto.ProductResponse.CategorySummary;
import com.example.ecommerce.product.dto.ProductResponse.ImageResponse;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record AdminProductResponse(Long id, String sku, String slug, String name, String description,
                                   BigDecimal price, String currency, boolean active, CategorySummary category,
                                   List<ImageResponse> images, int stock, boolean inStock, Instant createdAt) {

    public AdminProductResponse(ProductResponse product, int stock) {
        this(product.id(), product.sku(), product.slug(), product.name(), product.description(), product.price(),
                product.currency(), product.active(), product.category(), product.images(), stock,
                product.inStock(), product.createdAt());
    }
}
