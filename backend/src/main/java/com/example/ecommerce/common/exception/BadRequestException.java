package com.example.ecommerce.common.exception;

/** Invalid client input that Bean Validation cannot express (400). */
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}
