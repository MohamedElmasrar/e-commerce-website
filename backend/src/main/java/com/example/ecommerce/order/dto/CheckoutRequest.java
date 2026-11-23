package com.example.ecommerce.order.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record CheckoutRequest(@NotNull @Valid ShippingAddressRequest shippingAddress) {}
