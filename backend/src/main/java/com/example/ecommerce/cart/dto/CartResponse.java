package com.example.ecommerce.cart.dto;

import java.math.BigDecimal;
import java.util.List;

public record CartResponse(List<Item> items, int totalQuantity, BigDecimal subtotal, String currency) {

    public record Item(Long productId, String slug, String name, BigDecimal unitPrice, String currency,
                       int quantity, BigDecimal lineTotal, boolean canIncreaseQuantity) {
    }
}
