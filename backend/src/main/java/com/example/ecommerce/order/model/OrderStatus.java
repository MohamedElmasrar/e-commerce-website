package com.example.ecommerce.order.model;

import java.util.EnumSet;
import java.util.Set;

public enum OrderStatus {
    PENDING_PAYMENT, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED;

    /** Allowed next states. CANCELLED and REFUNDED are terminal. */
    public Set<OrderStatus> allowedNext() {
        return switch (this) {
            case PENDING_PAYMENT -> EnumSet.of(PAID, CANCELLED);
            case PAID -> EnumSet.of(PROCESSING, CANCELLED, REFUNDED);
            case PROCESSING -> EnumSet.of(SHIPPED, CANCELLED, REFUNDED);
            case SHIPPED -> EnumSet.of(DELIVERED, REFUNDED);
            case DELIVERED -> EnumSet.of(REFUNDED);
            case CANCELLED, REFUNDED -> EnumSet.noneOf(OrderStatus.class);
        };
    }

    public boolean canTransitionTo(OrderStatus next) {
        return allowedNext().contains(next);
    }

    /** Statuses that count towards revenue. */
    public static Set<OrderStatus> revenueStatuses() {
        return EnumSet.of(PAID, PROCESSING, SHIPPED, DELIVERED);
    }
}
