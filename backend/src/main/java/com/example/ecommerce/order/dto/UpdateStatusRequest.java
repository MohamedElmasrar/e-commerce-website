package com.example.ecommerce.order.dto;

import com.example.ecommerce.order.model.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateStatusRequest(@NotNull OrderStatus status) {}
