package com.example.ecommerce.product.specification;

import java.math.BigDecimal;

public record ProductFilter(
        String q,
        Long categoryId,
        String categorySlug,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        Boolean inStock,
        boolean includeInactive) {}
