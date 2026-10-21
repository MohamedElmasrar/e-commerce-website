package com.example.ecommerce.payment.controller;

import com.example.ecommerce.common.dto.ApiError;
import com.example.ecommerce.common.dto.ApiErrors;
import com.example.ecommerce.payment.dto.CheckoutSessionResponse;
import com.example.ecommerce.payment.dto.PaymentResponse;
import com.example.ecommerce.payment.exception.CheckoutUnavailableException;
import com.example.ecommerce.payment.service.PaymentService;
import com.example.ecommerce.security.model.AuthenticatedUser;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/checkout-session/{orderId}")
    public CheckoutSessionResponse createCheckoutSession(@AuthenticationPrincipal AuthenticatedUser user,
                                                         @PathVariable Long orderId) {
        return paymentService.createCheckoutSession(user.id(), orderId);
    }

    @ExceptionHandler(CheckoutUnavailableException.class)
    public ResponseEntity<ApiError> checkoutUnavailable(CheckoutUnavailableException error, HttpServletRequest request) {
        HttpStatus status = HttpStatus.SERVICE_UNAVAILABLE;
        return ResponseEntity.status(status).body(ApiErrors.of(status, error.getMessage(), request.getRequestURI(), null));
    }

    @GetMapping("/order/{orderId}")
    public List<PaymentResponse> status(@AuthenticationPrincipal AuthenticatedUser user,
                                        @PathVariable Long orderId) {
        return paymentService.statusForOrder(user.id(), orderId);
    }

    /** Public endpoint called by Stripe. Authenticity comes from the Stripe-Signature header. */
    @PostMapping("/webhook")
    public ResponseEntity<Void> webhook(@RequestBody String payload,
                                        @RequestHeader(value = "Stripe-Signature", required = false) String signature) {
        paymentService.handleWebhook(payload, signature);
        return ResponseEntity.ok().build();
    }
}
