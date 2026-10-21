package com.example.ecommerce.product.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/** Create/update payload. {@code initialStock} is used on create only (use the inventory API afterwards). */
public record ProductRequest(
        @NotBlank @Size(max = 64) String sku,
        @Size(max = 220) @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$",
                message = "must be lowercase letters, digits and hyphens") String slug,
        @NotBlank @Size(max = 200) String name,
        @Size(max = 10000) String description,
        @NotNull @DecimalMin("0.00") @Digits(integer = 10, fraction = 2) BigDecimal price,
        @NotBlank @Pattern(regexp = "^[A-Z]{3}$", message = "must be a 3-letter uppercase currency code") String currency,
        @NotNull Long categoryId,
        Boolean active,
        @Min(0) Integer initialStock) {
}
