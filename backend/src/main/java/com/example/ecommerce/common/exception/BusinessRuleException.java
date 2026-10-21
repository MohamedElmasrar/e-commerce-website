package com.example.ecommerce.common.exception;

/** Business rule violated (422). */
public class BusinessRuleException extends RuntimeException {
    public BusinessRuleException(String message) {
        super(message);
    }
}
