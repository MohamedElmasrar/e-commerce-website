package com.example.ecommerce.inventory.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AdjustStockRequest(@NotNull Integer delta, @Size(max = 100) String note) {
}
