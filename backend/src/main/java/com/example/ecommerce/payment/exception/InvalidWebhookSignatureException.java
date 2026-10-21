package com.example.ecommerce.payment.exception;

import com.example.ecommerce.common.exception.BadRequestException;

public class InvalidWebhookSignatureException extends BadRequestException {
    public InvalidWebhookSignatureException() {
        super("Invalid webhook signature");
    }
}
