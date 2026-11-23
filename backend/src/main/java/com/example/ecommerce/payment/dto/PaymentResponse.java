package com.example.ecommerce.payment.dto;

import com.example.ecommerce.payment.model.PaymentStatus;
import java.math.BigDecimal;
import java.time.Instant;

public record PaymentResponse(
        Long id,
        Long orderId,
        PaymentStatus status,
        BigDecimal amount,
        String currency,
        Instant createdAt) {}
