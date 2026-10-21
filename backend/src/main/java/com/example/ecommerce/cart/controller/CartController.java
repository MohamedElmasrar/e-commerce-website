package com.example.ecommerce.cart.controller;

import com.example.ecommerce.cart.dto.CartItemRequest;
import com.example.ecommerce.cart.dto.CartResponse;
import com.example.ecommerce.cart.dto.UpdateQuantityRequest;
import com.example.ecommerce.cart.service.CartService;
import com.example.ecommerce.security.model.AuthenticatedUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public CartResponse get(@AuthenticationPrincipal AuthenticatedUser user) {
        return cartService.get(user.id());
    }

    @PostMapping("/items")
    public CartResponse add(@AuthenticationPrincipal AuthenticatedUser user,
                            @Valid @RequestBody CartItemRequest request) {
        return cartService.addItem(user.id(), request.productId(), request.quantity());
    }

    @PutMapping("/items/{productId}")
    public CartResponse setQuantity(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable Long productId,
                                    @Valid @RequestBody UpdateQuantityRequest request) {
        return cartService.setQuantity(user.id(), productId, request.quantity());
    }

    @DeleteMapping("/items/{productId}")
    public CartResponse remove(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable Long productId) {
        return cartService.removeItem(user.id(), productId);
    }

    @DeleteMapping
    public CartResponse clear(@AuthenticationPrincipal AuthenticatedUser user) {
        return cartService.clear(user.id());
    }
}
