package com.example.ecommerce.payment.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.ecommerce.common.exception.BusinessRuleException;
import com.example.ecommerce.config.properties.StripeProperties;
import com.example.ecommerce.order.event.OrderCancelledEvent;
import com.example.ecommerce.order.model.Order;
import com.example.ecommerce.order.model.OrderItem;
import com.example.ecommerce.order.model.OrderStatus;
import com.example.ecommerce.order.service.OrderService;
import com.example.ecommerce.payment.dto.CheckoutSessionResponse;
import com.example.ecommerce.payment.exception.InvalidWebhookSignatureException;
import com.example.ecommerce.payment.gateway.CheckoutSession;
import com.example.ecommerce.payment.gateway.CheckoutSessionRequest;
import com.example.ecommerce.payment.gateway.PaymentGateway;
import com.example.ecommerce.payment.gateway.WebhookEvent;
import com.example.ecommerce.payment.model.Payment;
import com.example.ecommerce.payment.model.PaymentStatus;
import com.example.ecommerce.payment.repository.PaymentRepository;
import com.example.ecommerce.payment.repository.ProcessedStripeEventRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock PaymentGateway gateway;
    @Mock PaymentRepository paymentRepository;
    @Mock ProcessedStripeEventRepository processedEvents;
    @Mock OrderService orderService;
    PaymentService service;

    @BeforeEach
    void setUp() {
        service = new PaymentService(gateway, paymentRepository, processedEvents, orderService,
                new StripeProperties("sk", "whsec", "http://ok", "http://cancel"));
    }

    private Order order(OrderStatus status) {
        Order o = new Order();
        o.setId(9L);
        o.setUserId(1L);
        o.setStatus(status);
        o.setTotal(new BigDecimal("40.00"));
        o.setCurrency("USD");
        OrderItem i = new OrderItem();
        i.setProductName("Tea");
        i.setUnitPrice(new BigDecimal("20.00"));
        i.setQuantity(2);
        o.getItems().add(i);
        return o;
    }

    @Test
    void checkoutSessionIsBuiltFromServerSideOrderAndPersisted() {
        when(orderService.findOwnedForUpdate(1L, 9L)).thenReturn(order(OrderStatus.PENDING_PAYMENT));
        when(gateway.createCheckoutSession(any())).thenReturn(new CheckoutSession("cs_1", "https://pay"));

        CheckoutSessionResponse r = service.createCheckoutSession(1L, 9L);

        assertThat(r.sessionId()).isEqualTo("cs_1");
        ArgumentCaptor<CheckoutSessionRequest> req = ArgumentCaptor.forClass(CheckoutSessionRequest.class);
        verify(gateway).createCheckoutSession(req.capture());
        assertThat(req.getValue().lines()).singleElement().satisfies(l -> {
            assertThat(l.unitPrice()).isEqualByComparingTo("20.00");
            assertThat(l.quantity()).isEqualTo(2);
        });
        assertThat(req.getValue().successUrl()).isEqualTo("http://ok");
        ArgumentCaptor<Payment> p = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).save(p.capture());
        assertThat(p.getValue().getAmount()).isEqualByComparingTo("40.00");
        assertThat(p.getValue().getStatus()).isEqualTo(PaymentStatus.CREATED);
    }

    @Test
    void paidOrderCannotStartCheckout() {
        when(orderService.findOwnedForUpdate(1L, 9L)).thenReturn(order(OrderStatus.PAID));
        assertThatThrownBy(() -> service.createCheckoutSession(1L, 9L)).isInstanceOf(BusinessRuleException.class);
        verify(gateway, never()).createCheckoutSession(any());
    }

    @Test
    void completedEventMarksPaymentAndOrderPaid() {
        Payment payment = new Payment();
        payment.setOrderId(9L);
        payment.setStatus(PaymentStatus.CREATED);
        when(gateway.parseWebhook("p", "s")).thenReturn(
                new WebhookEvent("evt_1", WebhookEvent.CHECKOUT_COMPLETED, "cs_1", "pi_1", 9L));
        when(processedEvents.insertIfAbsent("evt_1", WebhookEvent.CHECKOUT_COMPLETED)).thenReturn(1);
        when(paymentRepository.findByStripeSessionId("cs_1")).thenReturn(Optional.of(payment));
        when(orderService.markPaid(9L)).thenReturn(true);

        service.handleWebhook("p", "s");

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.SUCCEEDED);
        assertThat(payment.getPaymentIntentId()).isEqualTo("pi_1");
        verify(orderService).markPaid(9L);
    }

    @Test
    void replayedEventIsNoOp() {
        when(gateway.parseWebhook("p", "s")).thenReturn(
                new WebhookEvent("evt_1", WebhookEvent.CHECKOUT_COMPLETED, "cs_1", "pi_1", 9L));
        when(processedEvents.insertIfAbsent("evt_1", WebhookEvent.CHECKOUT_COMPLETED)).thenReturn(0);

        service.handleWebhook("p", "s");

        verify(orderService, never()).markPaid(any());
        verify(paymentRepository, never()).save(any());
    }

    @Test
    void expiredEventCancelsOrderAndMarksPaymentExpired() {
        Payment payment = new Payment();
        payment.setOrderId(9L);
        payment.setStatus(PaymentStatus.CREATED);
        when(gateway.parseWebhook("p", "s")).thenReturn(
                new WebhookEvent("evt_2", WebhookEvent.CHECKOUT_EXPIRED, "cs_1", null, 9L));
        when(processedEvents.insertIfAbsent("evt_2", WebhookEvent.CHECKOUT_EXPIRED)).thenReturn(1);
        when(paymentRepository.findByStripeSessionId("cs_1")).thenReturn(Optional.of(payment));

        service.handleWebhook("p", "s");

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.EXPIRED);
        verify(orderService).cancelUnpaid(9L);
    }

    @Test
    void failedEventMarksPaymentFailedWithoutTouchingOrder() {
        Payment payment = new Payment();
        payment.setStatus(PaymentStatus.CREATED);
        when(gateway.parseWebhook("p", "s")).thenReturn(
                new WebhookEvent("evt_3", WebhookEvent.PAYMENT_FAILED, null, "pi_9", 9L));
        when(processedEvents.insertIfAbsent("evt_3", WebhookEvent.PAYMENT_FAILED)).thenReturn(1);
        when(paymentRepository.findFirstByOrderIdAndStatusOrderByIdDesc(9L, PaymentStatus.CREATED))
                .thenReturn(Optional.of(payment));

        service.handleWebhook("p", "s");

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.FAILED);
        verify(orderService, never()).cancelUnpaid(any());
    }

    private Payment payment(String sessionId, PaymentStatus status) {
        Payment p = new Payment();
        p.setOrderId(9L);
        p.setStripeSessionId(sessionId);
        p.setStatus(status);
        return p;
    }

    @Test
    void newCheckoutSessionExpiresThePreviousOneAndUsesAStableIdempotencyKey() {
        Payment old = payment("cs_old", PaymentStatus.CREATED);
        when(orderService.findOwnedForUpdate(1L, 9L)).thenReturn(order(OrderStatus.PENDING_PAYMENT));
        when(paymentRepository.findByOrderIdAndStatus(9L, PaymentStatus.CREATED)).thenReturn(List.of(old));
        when(paymentRepository.countByOrderId(9L)).thenReturn(1L);
        when(gateway.createCheckoutSession(any())).thenReturn(new CheckoutSession("cs_new", "https://pay"));

        service.createCheckoutSession(1L, 9L);

        verify(gateway).expireSession("cs_old");
        assertThat(old.getStatus()).isEqualTo(PaymentStatus.EXPIRED);
        ArgumentCaptor<CheckoutSessionRequest> req = ArgumentCaptor.forClass(CheckoutSessionRequest.class);
        verify(gateway).createCheckoutSession(req.capture());
        assertThat(req.getValue().idempotencyKey()).isEqualTo("checkout-order-9-1");
    }

    @Test
    void sameAttemptReturnsExistingSessionInsteadOfSavingADuplicateRow() {
        when(orderService.findOwnedForUpdate(1L, 9L)).thenReturn(order(OrderStatus.PENDING_PAYMENT));
        when(gateway.createCheckoutSession(any())).thenReturn(new CheckoutSession("cs_1", "https://pay"));
        when(paymentRepository.findByStripeSessionId("cs_1"))
                .thenReturn(Optional.of(payment("cs_1", PaymentStatus.CREATED)));

        CheckoutSessionResponse r = service.createCheckoutSession(1L, 9L);

        assertThat(r.sessionId()).isEqualTo("cs_1");
        verify(paymentRepository, never()).save(any());
    }

    @Test
    void expiredSessionDoesNotCancelOrderWhileAnotherSessionIsLive() {
        Payment expired = payment("cs_1", PaymentStatus.CREATED);
        when(gateway.parseWebhook("p", "s")).thenReturn(
                new WebhookEvent("evt_2", WebhookEvent.CHECKOUT_EXPIRED, "cs_1", null, 9L));
        when(processedEvents.insertIfAbsent("evt_2", WebhookEvent.CHECKOUT_EXPIRED)).thenReturn(1);
        when(paymentRepository.findByStripeSessionId("cs_1")).thenReturn(Optional.of(expired));
        when(paymentRepository.existsByOrderIdAndStatus(9L, PaymentStatus.CREATED)).thenReturn(true);

        service.handleWebhook("p", "s");

        assertThat(expired.getStatus()).isEqualTo(PaymentStatus.EXPIRED);
        verify(orderService, never()).cancelUnpaid(any());
    }

    @Test
    void paymentForCancelledOrderIsRefunded() {
        Payment payment = payment("cs_1", PaymentStatus.CREATED);
        when(gateway.parseWebhook("p", "s")).thenReturn(
                new WebhookEvent("evt_1", WebhookEvent.CHECKOUT_COMPLETED, "cs_1", "pi_1", 9L));
        when(processedEvents.insertIfAbsent("evt_1", WebhookEvent.CHECKOUT_COMPLETED)).thenReturn(1);
        when(paymentRepository.findByStripeSessionId("cs_1")).thenReturn(Optional.of(payment));
        when(orderService.markPaid(9L)).thenReturn(false);

        service.handleWebhook("p", "s");

        verify(gateway).refund("pi_1");
        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.REFUNDED);
    }

    @Test
    void secondPaymentForAlreadyPaidOrderIsRefunded() {
        Payment payment = payment("cs_2", PaymentStatus.CREATED);
        when(gateway.parseWebhook("p", "s")).thenReturn(
                new WebhookEvent("evt_5", WebhookEvent.CHECKOUT_COMPLETED, "cs_2", "pi_2", 9L));
        when(processedEvents.insertIfAbsent("evt_5", WebhookEvent.CHECKOUT_COMPLETED)).thenReturn(1);
        when(paymentRepository.findByStripeSessionId("cs_2")).thenReturn(Optional.of(payment));
        when(orderService.markPaid(9L)).thenReturn(false);

        service.handleWebhook("p", "s");

        verify(gateway).refund("pi_2");
    }

    @Test
    void acceptedPaymentIsNotRefunded() {
        Payment payment = payment("cs_1", PaymentStatus.CREATED);
        when(gateway.parseWebhook("p", "s")).thenReturn(
                new WebhookEvent("evt_1", WebhookEvent.CHECKOUT_COMPLETED, "cs_1", "pi_1", 9L));
        when(processedEvents.insertIfAbsent("evt_1", WebhookEvent.CHECKOUT_COMPLETED)).thenReturn(1);
        when(paymentRepository.findByStripeSessionId("cs_1")).thenReturn(Optional.of(payment));
        when(orderService.markPaid(9L)).thenReturn(true);

        service.handleWebhook("p", "s");

        verify(gateway, never()).refund(any());
        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.SUCCEEDED);
    }

    @Test
    void cancellingAnOrderExpiresItsOpenStripeSession() {
        Payment open = payment("cs_1", PaymentStatus.CREATED);
        when(paymentRepository.findByOrderIdAndStatus(9L, PaymentStatus.CREATED)).thenReturn(List.of(open));

        service.onOrderCancelled(new OrderCancelledEvent(9L));

        verify(gateway).expireSession("cs_1");
        assertThat(open.getStatus()).isEqualTo(PaymentStatus.EXPIRED);
    }

    @Test
    void invalidSignatureStopsBeforeAnyStateChange() {
        when(gateway.parseWebhook("p", "bad")).thenThrow(new InvalidWebhookSignatureException());
        assertThatThrownBy(() -> service.handleWebhook("p", "bad")).isInstanceOf(InvalidWebhookSignatureException.class);
        verify(processedEvents, never()).insertIfAbsent(any(), any());
    }
}
