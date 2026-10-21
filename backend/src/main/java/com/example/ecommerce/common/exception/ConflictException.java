package com.example.ecommerce.common.exception;

/** Conflict with current state (409). */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
