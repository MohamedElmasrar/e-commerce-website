package com.example.ecommerce.order.mapper;

import com.example.ecommerce.order.dto.OrderResponse;
import com.example.ecommerce.order.dto.OrderResponse.Item;
import com.example.ecommerce.order.dto.ShippingAddressRequest;
import com.example.ecommerce.order.model.Order;
import java.math.BigDecimal;
import org.springframework.stereotype.Component;

@Component
public class OrderMapper {

    public OrderResponse toResponse(Order o) {
        return new OrderResponse(
                o.getId(),
                o.getUserId(),
                o.getStatus(),
                o.getTotal(),
                o.getCurrency(),
                new ShippingAddressRequest(
                        o.getShippingName(),
                        o.getShippingLine1(),
                        o.getShippingLine2(),
                        o.getShippingCity(),
                        o.getShippingState(),
                        o.getShippingPostal(),
                        o.getShippingCountry()),
                o.getItems().stream()
                        .map(i ->
                                new Item(
                                        i.getProductId(),
                                        i.getProductName(),
                                        i.getSku(),
                                        i.getUnitPrice(),
                                        i.getQuantity(),
                                        i.getUnitPrice()
                                                .multiply(BigDecimal.valueOf(i.getQuantity()))))
                        .toList(),
                o.getCreatedAt());
    }

    public void applyShipping(ShippingAddressRequest a, Order o) {
        o.setShippingName(a.name());
        o.setShippingLine1(a.line1());
        o.setShippingLine2(a.line2());
        o.setShippingCity(a.city());
        o.setShippingState(a.state());
        o.setShippingPostal(a.postalCode());
        o.setShippingCountry(a.country());
    }
}
