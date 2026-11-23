package com.example.ecommerce.order.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ShippingAddressRequest(
        @NotBlank @Size(max = 150) String name,
        @NotBlank @Size(max = 255) String line1,
        @Size(max = 255) String line2,
        @NotBlank @Size(max = 120) String city,
        @Size(max = 120) String state,
        @NotBlank @Size(max = 20) String postalCode,
        @NotBlank
                @Pattern(
                        regexp = "^[A-Z]{2}$",
                        message = "must be a 2-letter uppercase country code")
                String country) {}
