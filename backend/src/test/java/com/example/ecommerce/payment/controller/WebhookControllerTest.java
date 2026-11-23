package com.example.ecommerce.payment.controller;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.ecommerce.common.exception.GlobalExceptionHandler;
import com.example.ecommerce.common.filter.RequestIdFilter;
import com.example.ecommerce.config.properties.CorsProperties;
import com.example.ecommerce.config.properties.JwtProperties;
import com.example.ecommerce.config.properties.StripeProperties;
import com.example.ecommerce.order.service.OrderService;
import com.example.ecommerce.payment.gateway.StripePaymentGateway;
import com.example.ecommerce.payment.model.Payment;
import com.example.ecommerce.payment.model.PaymentStatus;
import com.example.ecommerce.payment.repository.PaymentRepository;
import com.example.ecommerce.payment.repository.ProcessedStripeEventRepository;
import com.example.ecommerce.payment.service.PaymentService;
import com.example.ecommerce.security.config.SecurityConfig;
import com.example.ecommerce.security.service.JwtService;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.Optional;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Posts real HMAC-signed payloads (test secret whsec_dummy) through the real gateway and service.
 */
@WebMvcTest(PaymentController.class)
@ActiveProfiles("test")
@EnableConfigurationProperties({JwtProperties.class, CorsProperties.class, StripeProperties.class})
@Import({
    SecurityConfig.class,
    JwtService.class,
    GlobalExceptionHandler.class,
    RequestIdFilter.class,
    PaymentService.class,
    StripePaymentGateway.class
})
class WebhookControllerTest {

    private static final String SECRET = "whsec_dummy";

    @Autowired MockMvc mvc;
    @MockBean PaymentRepository paymentRepository;
    @MockBean ProcessedStripeEventRepository processedEvents;
    @MockBean OrderService orderService;

    private static String payload(String eventId) {
        return """
        {"id":"%s","object":"event","api_version":"2020-01-01","created":1700000000,
         "type":"checkout.session.completed",
         "data":{"object":{"id":"cs_test_1","object":"checkout.session","payment_intent":"pi_1",
         "metadata":{"orderId":"42"}}}}
        """
                .formatted(eventId);
    }

    private static String sign(String payload, String secret, long timestamp) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        String hex =
                HexFormat.of()
                        .formatHex(
                                mac.doFinal(
                                        (timestamp + "." + payload)
                                                .getBytes(StandardCharsets.UTF_8)));
        return "t=" + timestamp + ",v1=" + hex;
    }

    private static long now() {
        return System.currentTimeMillis() / 1000;
    }

    private Payment createdPayment() {
        Payment p = new Payment();
        p.setOrderId(42L);
        p.setStatus(PaymentStatus.CREATED);
        return p;
    }

    @Test
    void validSignatureMarksOrderPaid() throws Exception {
        String body = payload("evt_ok");
        when(processedEvents.insertIfAbsent("evt_ok", "checkout.session.completed")).thenReturn(1);
        when(paymentRepository.findByStripeSessionId("cs_test_1"))
                .thenReturn(Optional.of(createdPayment()));
        when(orderService.markPaid(42L)).thenReturn(true);

        mvc.perform(
                        post("/api/v1/payments/webhook")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body)
                                .header("Stripe-Signature", sign(body, SECRET, now())))
                .andExpect(status().isOk());

        verify(orderService).markPaid(42L);
    }

    @Test
    void wrongSignatureIs400AndNothingIsProcessed() throws Exception {
        String body = payload("evt_bad");
        mvc.perform(
                        post("/api/v1/payments/webhook")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body)
                                .header("Stripe-Signature", sign(body, "whsec_other", now())))
                .andExpect(status().isBadRequest());
        verify(processedEvents, never()).insertIfAbsent(anyString(), anyString());
        verify(orderService, never()).markPaid(42L);
    }

    @Test
    void tamperedPayloadIs400() throws Exception {
        String body = payload("evt_t");
        String sig = sign(body, SECRET, now());
        mvc.perform(
                        post("/api/v1/payments/webhook")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body.replace("42", "43"))
                                .header("Stripe-Signature", sig))
                .andExpect(status().isBadRequest());
    }

    @Test
    void missingSignatureHeaderIs400() throws Exception {
        mvc.perform(
                        post("/api/v1/payments/webhook")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(payload("e")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void replayedEventIdIsProcessedOnce() throws Exception {
        String body = payload("evt_replay");
        when(processedEvents.insertIfAbsent("evt_replay", "checkout.session.completed"))
                .thenReturn(1, 0);
        when(paymentRepository.findByStripeSessionId("cs_test_1"))
                .thenReturn(Optional.of(createdPayment()));
        when(orderService.markPaid(42L)).thenReturn(true);
        String sig = sign(body, SECRET, now());

        for (int i = 0; i < 2; i++) {
            mvc.perform(
                            post("/api/v1/payments/webhook")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(body)
                                    .header("Stripe-Signature", sig))
                    .andExpect(status().isOk());
        }

        verify(orderService, times(1)).markPaid(42L);
    }
}
