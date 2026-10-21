package com.example.ecommerce.inventory.dto;

public record InventoryResponse(Long productId, String sku, String name, int quantityOnHand, boolean lowStock) {
}
