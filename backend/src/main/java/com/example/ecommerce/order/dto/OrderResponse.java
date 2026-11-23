package com.example.ecommerce.order.dto;

import com.example.ecommerce.order.model.OrderStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderResponse(
        Long id,
        Long userId,
        OrderStatus status,
        BigDecimal total,
        String currency,
        ShippingAddressRequest shippingAddress,
        List<Item> items,
        Instant createdAt) {

    public record Item(
            Long productId,
            String productName,
            String sku,
            BigDecimal unitPrice,
            int quantity,
            BigDecimal lineTotal) {}
}
