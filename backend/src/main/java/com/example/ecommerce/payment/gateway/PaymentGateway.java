package com.example.ecommerce.payment.gateway;

/** Adapter over the payment provider. The only class family that knows about Stripe types. */
public interface PaymentGateway {

    CheckoutSession createCheckoutSession(CheckoutSessionRequest request);

    /**
     * Stops an open checkout session from being paid. Best effort: a session that already completed
     * or expired is left alone, because a late payment is refunded when its webhook arrives.
     */
    void expireSession(String sessionId);

    /** Refunds the full amount of a payment. Idempotent per payment intent. */
    void refund(String paymentIntentId);

    /**
     * Verifies the signature of the raw payload and returns the parsed event.
     *
     * @throws InvalidWebhookSignatureException if the signature is missing or does not match
     */
    WebhookEvent parseWebhook(String payload, String signatureHeader);
}
