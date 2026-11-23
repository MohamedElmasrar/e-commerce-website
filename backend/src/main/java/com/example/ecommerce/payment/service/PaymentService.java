package com.example.ecommerce.payment.service;

import com.example.ecommerce.common.exception.BusinessRuleException;
import com.example.ecommerce.config.properties.StripeProperties;
import com.example.ecommerce.order.event.OrderCancelledEvent;
import com.example.ecommerce.order.model.Order;
import com.example.ecommerce.order.model.OrderStatus;
import com.example.ecommerce.order.service.OrderService;
import com.example.ecommerce.payment.dto.CheckoutSessionResponse;
import com.example.ecommerce.payment.dto.PaymentResponse;
import com.example.ecommerce.payment.gateway.CheckoutSession;
import com.example.ecommerce.payment.gateway.CheckoutSessionRequest;
import com.example.ecommerce.payment.gateway.CheckoutSessionRequest.Line;
import com.example.ecommerce.payment.gateway.PaymentGateway;
import com.example.ecommerce.payment.gateway.WebhookEvent;
import com.example.ecommerce.payment.model.Payment;
import com.example.ecommerce.payment.model.PaymentStatus;
import com.example.ecommerce.payment.repository.PaymentRepository;
import com.example.ecommerce.payment.repository.ProcessedStripeEventRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentGateway gateway;
    private final PaymentRepository paymentRepository;
    private final ProcessedStripeEventRepository processedEvents;
    private final OrderService orderService;
    private final StripeProperties stripeProperties;

    /** Amounts come from the persisted order, never from the client. */
    @Transactional
    public CheckoutSessionResponse createCheckoutSession(Long userId, Long orderId) {
        // The order row lock serializes double-clicked requests; the second one sees the first
        // one's session.
        Order order = orderService.findOwnedForUpdate(userId, orderId);
        if (order.getStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new BusinessRuleException("Order is not awaiting payment");
        }
        List<Line> lines =
                order.getItems().stream()
                        .map(i -> new Line(i.getProductName(), i.getUnitPrice(), i.getQuantity()))
                        .toList();
        // One live session per order: a retry replaces the previous session instead of adding a
        // second.
        expireOpenSessions(order.getId());
        // The key is stable per attempt number, so a retry after a failure returns the same Stripe
        // session.
        String idempotencyKey =
                "checkout-order-"
                        + order.getId()
                        + "-"
                        + paymentRepository.countByOrderId(order.getId());
        CheckoutSession session =
                gateway.createCheckoutSession(
                        new CheckoutSessionRequest(
                                order.getId(),
                                order.getCurrency(),
                                lines,
                                stripeProperties.successUrl(),
                                stripeProperties.cancelUrl(),
                                idempotencyKey));
        if (paymentRepository.findByStripeSessionId(session.sessionId()).isPresent()) {
            return new CheckoutSessionResponse(session.sessionId(), session.url());
        }
        Payment payment = new Payment();
        payment.setOrderId(order.getId());
        payment.setStripeSessionId(session.sessionId());
        payment.setStatus(PaymentStatus.CREATED);
        payment.setAmount(order.getTotal());
        payment.setCurrency(order.getCurrency());
        paymentRepository.save(payment);
        return new CheckoutSessionResponse(session.sessionId(), session.url());
    }

    /** Closes the Stripe session of an order that was cancelled, so it can no longer be paid. */
    @EventListener
    public void onOrderCancelled(OrderCancelledEvent event) {
        expireOpenSessions(event.orderId());
    }

    private void expireOpenSessions(Long orderId) {
        for (Payment open :
                paymentRepository.findByOrderIdAndStatus(orderId, PaymentStatus.CREATED)) {
            gateway.expireSession(open.getStripeSessionId());
            open.setStatus(PaymentStatus.EXPIRED);
            paymentRepository.save(open);
        }
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> statusForOrder(Long userId, Long orderId) {
        orderService.findOwned(userId, orderId);
        return paymentRepository.findByOrderIdOrderByIdDesc(orderId).stream()
                .map(p ->
                        new PaymentResponse(
                                p.getId(),
                                p.getOrderId(),
                                p.getStatus(),
                                p.getAmount(),
                                p.getCurrency(),
                                p.getCreatedAt()))
                .toList();
    }

    /**
     * Verifies and applies a webhook delivery. The event id insert and the state changes share one
     * transaction: a failure rolls back the id so Stripe's retry is processed, a replay is a no-op.
     */
    @Transactional
    public void handleWebhook(String payload, String signatureHeader) {
        WebhookEvent event = gateway.parseWebhook(payload, signatureHeader);
        if (processedEvents.insertIfAbsent(event.id(), event.type()) == 0) {
            log.info("Ignoring already processed Stripe event {}", event.id());
            return;
        }
        switch (event.type()) {
            case WebhookEvent.CHECKOUT_COMPLETED -> onCompleted(event);
            case WebhookEvent.CHECKOUT_EXPIRED -> onExpired(event);
            case WebhookEvent.PAYMENT_FAILED -> onFailed(event);
            default -> log.debug("Ignoring Stripe event type {}", event.type());
        }
    }

    private void onCompleted(WebhookEvent event) {
        Payment payment = paymentRepository.findByStripeSessionId(event.sessionId()).orElse(null);
        if (payment == null) {
            log.warn("Completed session {} has no payment row", event.sessionId());
            return;
        }
        if (payment.getStatus() == PaymentStatus.SUCCEEDED
                || payment.getStatus() == PaymentStatus.REFUNDED) {
            return;
        }
        payment.setStatus(PaymentStatus.SUCCEEDED);
        payment.setPaymentIntentId(event.paymentIntentId());
        if (!orderService.markPaid(payment.getOrderId())) {
            // The order was cancelled or is already paid by another session: never keep this money.
            if (event.paymentIntentId() == null) {
                log.error(
                        "Payment for order {} cannot be applied and has no payment intent to refund",
                        payment.getOrderId());
            } else {
                gateway.refund(event.paymentIntentId());
                payment.setStatus(PaymentStatus.REFUNDED);
                log.warn(
                        "Refunded payment {} for order {}: order cannot accept it",
                        event.paymentIntentId(),
                        payment.getOrderId());
            }
        }
        paymentRepository.save(payment);
    }

    private void onExpired(WebhookEvent event) {
        paymentRepository
                .findByStripeSessionId(event.sessionId())
                .ifPresent(payment -> {
                    payment.setStatus(PaymentStatus.EXPIRED);
                    paymentRepository.save(payment);
                    // Another live session may still pay for this order; only cancel when none is
                    // left.
                    if (!paymentRepository.existsByOrderIdAndStatus(
                            payment.getOrderId(), PaymentStatus.CREATED)) {
                        orderService.cancelUnpaid(payment.getOrderId());
                    }
                });
    }

    private void onFailed(WebhookEvent event) {
        if (event.orderId() == null) {
            return;
        }
        paymentRepository
                .findFirstByOrderIdAndStatusOrderByIdDesc(event.orderId(), PaymentStatus.CREATED)
                .ifPresent(payment -> {
                    payment.setStatus(PaymentStatus.FAILED);
                    payment.setPaymentIntentId(event.paymentIntentId());
                    paymentRepository.save(payment);
                });
    }
}
