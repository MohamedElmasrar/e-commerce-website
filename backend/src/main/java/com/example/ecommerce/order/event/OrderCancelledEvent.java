package com.example.ecommerce.order.event;

/** Published inside the cancelling transaction, after the order's stock was released. */
public record OrderCancelledEvent(Long orderId) {}
