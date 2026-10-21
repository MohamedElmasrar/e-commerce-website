package com.example.ecommerce.inventory.exception;

import com.example.ecommerce.common.exception.ConflictException;

/** Not enough stock to satisfy a reservation (409). */
public class InsufficientStockException extends ConflictException {
    public InsufficientStockException(Long productId, int requested) {
        super("Insufficient stock for product " + productId + " (requested " + requested + ")");
    }
}
