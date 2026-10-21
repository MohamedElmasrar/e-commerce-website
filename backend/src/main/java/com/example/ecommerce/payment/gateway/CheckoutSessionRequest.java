package com.example.ecommerce.payment.gateway;

import java.math.BigDecimal;
import java.util.List;

/** Provider-neutral description of what to charge. Built from the persisted order only. */
public record CheckoutSessionRequest(Long orderId, String currency, List<Line> lines, String successUrl,
                                     String cancelUrl, String idempotencyKey) {

    public record Line(String name, BigDecimal unitPrice, int quantity) {
    }
}
