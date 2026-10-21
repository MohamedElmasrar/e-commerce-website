package com.example.ecommerce.cart.mapper;

import com.example.ecommerce.cart.dto.CartResponse;
import com.example.ecommerce.cart.model.Cart;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class CartMapper {

    /** Prices are always taken from the product rows, never from the client. */
    public CartResponse toResponse(Cart cart, Map<Long, Integer> stock) {
        List<CartResponse.Item> items = cart.getItems().stream().map(i -> {
            var p = i.getProduct();
            return new CartResponse.Item(p.getId(), p.getSlug(), p.getName(), p.getPrice(), p.getCurrency(),
                    i.getQuantity(), p.getPrice().multiply(BigDecimal.valueOf(i.getQuantity())),
                    i.getQuantity() < stock.getOrDefault(p.getId(), 0));
        }).toList();
        BigDecimal subtotal = items.stream().map(CartResponse.Item::lineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        int qty = items.stream().mapToInt(CartResponse.Item::quantity).sum();
        String currency = items.isEmpty() ? "USD" : items.get(0).currency();
        return new CartResponse(items, qty, subtotal, currency);
    }
}
