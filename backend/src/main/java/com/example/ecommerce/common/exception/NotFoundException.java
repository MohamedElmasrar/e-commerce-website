package com.example.ecommerce.common.exception;

/** Resource not found (404). */
public class NotFoundException extends RuntimeException {
    public NotFoundException(String message) {
        super(message);
    }
}
