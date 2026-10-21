package com.example.ecommerce.payment.exception;

public class CheckoutUnavailableException extends RuntimeException {

    public CheckoutUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
