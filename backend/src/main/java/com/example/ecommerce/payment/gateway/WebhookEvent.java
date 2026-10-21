package com.example.ecommerce.payment.gateway;

/** Provider-neutral view of a verified webhook event. */
public record WebhookEvent(String id, String type, String sessionId, String paymentIntentId, Long orderId) {

    public static final String CHECKOUT_COMPLETED = "checkout.session.completed";
    public static final String CHECKOUT_EXPIRED = "checkout.session.expired";
    public static final String PAYMENT_FAILED = "payment_intent.payment_failed";
}
