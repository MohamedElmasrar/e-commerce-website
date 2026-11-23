package com.example.ecommerce.inventory.repository;

/**
 * Admin listing row joining inventory with product identity (native query, no product entity
 * dependency).
 */
public interface InventoryRow {
    Long getProductId();

    String getSku();

    String getName();

    Integer getQuantityOnHand();
}
