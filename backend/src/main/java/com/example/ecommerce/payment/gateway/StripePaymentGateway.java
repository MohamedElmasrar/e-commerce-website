package com.example.ecommerce.payment.gateway;

import com.example.ecommerce.config.properties.StripeProperties;
import com.example.ecommerce.payment.exception.CheckoutUnavailableException;
import com.example.ecommerce.payment.exception.InvalidWebhookSignatureException;
import com.stripe.StripeClient;
import com.stripe.exception.EventDataObjectDeserializationException;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.model.StripeObject;
import com.stripe.model.checkout.Session;
import com.stripe.net.RequestOptions;
import com.stripe.net.Webhook;
import com.stripe.param.RefundCreateParams;
import com.stripe.param.checkout.SessionCreateParams;
import java.time.Instant;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class StripePaymentGateway implements PaymentGateway {

    private final StripeClient client;
    private final String webhookSecret;

    public StripePaymentGateway(StripeProperties properties) {
        this.client = new StripeClient(properties.secretKey());
        this.webhookSecret = properties.webhookSecret();
    }

    @Override
    public CheckoutSession createCheckoutSession(CheckoutSessionRequest request) {
        String orderId = String.valueOf(request.orderId());
        SessionCreateParams.Builder params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(request.successUrl())
                .setCancelUrl(request.cancelUrl())
                .setClientReferenceId(orderId)
                .setExpiresAt(Instant.now().plusSeconds(30 * 60).getEpochSecond())
                .putMetadata("orderId", orderId)
                .setPaymentIntentData(SessionCreateParams.PaymentIntentData.builder()
                        .putMetadata("orderId", orderId).build());
        for (CheckoutSessionRequest.Line line : request.lines()) {
            params.addLineItem(SessionCreateParams.LineItem.builder()
                    .setQuantity((long) line.quantity())
                    .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                            .setCurrency(request.currency().toLowerCase())
                            .setUnitAmount(line.unitPrice().movePointRight(2).longValueExact())
                            .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                    .setName(line.name()).build())
                            .build())
                    .build());
        }
        try {
            Session session = client.checkout().sessions().create(params.build(),
                    RequestOptions.builder().setIdempotencyKey(request.idempotencyKey()).build());
            return new CheckoutSession(session.getId(), session.getUrl());
        } catch (StripeException e) {
            log.error("Stripe checkout session creation failed for order {}: {}", orderId, e.getMessage());
            throw new CheckoutUnavailableException("The payment service could not open checkout. Please try again later.", e);
        }
    }

    @Override
    public void expireSession(String sessionId) {
        try {
            client.checkout().sessions().expire(sessionId);
        } catch (StripeException e) {
            log.warn("Could not expire Stripe session {}: {}", sessionId, e.getMessage());
        }
    }

    @Override
    public void refund(String paymentIntentId) {
        try {
            client.refunds().create(RefundCreateParams.builder().setPaymentIntent(paymentIntentId).build(),
                    RequestOptions.builder().setIdempotencyKey("refund-" + paymentIntentId).build());
        } catch (StripeException e) {
            log.error("Stripe refund failed for payment intent {}: {}", paymentIntentId, e.getMessage());
            throw new IllegalStateException("Payment provider error", e);
        }
    }

    @Override
    public WebhookEvent parseWebhook(String payload, String signatureHeader) {
        if (payload == null || signatureHeader == null || signatureHeader.isBlank()) {
            throw new InvalidWebhookSignatureException();
        }
        Event event;
        try {
            event = Webhook.constructEvent(payload, signatureHeader, webhookSecret);
        } catch (SignatureVerificationException | RuntimeException e) {
            throw new InvalidWebhookSignatureException();
        }
        StripeObject object = null;
        try {
            object = event.getDataObjectDeserializer().deserializeUnsafe();
        } catch (EventDataObjectDeserializationException | RuntimeException e) {
            log.warn("Could not deserialize data of Stripe event {} ({})", event.getId(), event.getType());
        }
        if (object instanceof Session s) {
            return new WebhookEvent(event.getId(), event.getType(), s.getId(), s.getPaymentIntent(),
                    orderId(s.getMetadata()));
        }
        if (object instanceof PaymentIntent pi) {
            return new WebhookEvent(event.getId(), event.getType(), null, pi.getId(), orderId(pi.getMetadata()));
        }
        return new WebhookEvent(event.getId(), event.getType(), null, null, null);
    }

    private static Long orderId(Map<String, String> metadata) {
        try {
            return metadata == null || metadata.get("orderId") == null ? null : Long.valueOf(metadata.get("orderId"));
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
