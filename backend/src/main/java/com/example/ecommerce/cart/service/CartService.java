package com.example.ecommerce.cart.service;

import com.example.ecommerce.cart.dto.CartResponse;
import com.example.ecommerce.cart.mapper.CartMapper;
import com.example.ecommerce.cart.model.Cart;
import com.example.ecommerce.cart.model.CartItem;
import com.example.ecommerce.cart.repository.CartRepository;
import com.example.ecommerce.common.exception.BusinessRuleException;
import com.example.ecommerce.common.exception.NotFoundException;
import com.example.ecommerce.inventory.exception.InsufficientStockException;
import com.example.ecommerce.inventory.service.InventoryService;
import com.example.ecommerce.product.model.Product;
import com.example.ecommerce.product.service.ProductService;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final ProductService productService;
    private final InventoryService inventoryService;
    private final CartMapper mapper;

    @Transactional
    public CartResponse get(Long userId) {
        return toResponse(getOrCreate(userId));
    }

    @Transactional
    public CartResponse addItem(Long userId, Long productId, int quantity) {
        Cart cart = getOrCreate(userId);
        Product product = activeProduct(productId);
        CartItem item = findItem(cart, productId);
        int newQty = (item == null ? 0 : item.getQuantity()) + quantity;
        checkStock(productId, newQty);
        if (item == null) {
            item = new CartItem();
            item.setCart(cart);
            item.setProduct(product);
            cart.getItems().add(item);
        }
        item.setQuantity(newQty);
        cartRepository.saveAndFlush(cart);
        return toResponse(cart);
    }

    @Transactional
    public CartResponse setQuantity(Long userId, Long productId, int quantity) {
        Cart cart = getOrCreate(userId);
        CartItem item = findItem(cart, productId);
        if (item == null) {
            throw new NotFoundException("Product not in cart: " + productId);
        }
        activeProduct(productId);
        checkStock(productId, quantity);
        item.setQuantity(quantity);
        cartRepository.saveAndFlush(cart);
        return toResponse(cart);
    }

    @Transactional
    public CartResponse removeItem(Long userId, Long productId) {
        Cart cart = getOrCreate(userId);
        cart.getItems().removeIf(i -> i.getProduct().getId().equals(productId));
        cartRepository.saveAndFlush(cart);
        return toResponse(cart);
    }

    @Transactional
    public CartResponse clear(Long userId) {
        Cart cart = getOrCreate(userId);
        clear(cart);
        return toResponse(cart);
    }

    /**
     * Loads and row-locks the user's cart (with items and products) for checkout. Must run inside
     * the caller's transaction.
     */
    @Transactional
    public Cart loadForCheckout(Long userId) {
        // Lock first: the items are read only after the lock is granted, so a request that waited
        // loads the cart as the winning checkout left it (cleared). Held until the transaction
        // ends.
        cartRepository.findByUserIdForUpdate(userId).orElseGet(() -> getOrCreate(userId));
        return getOrCreate(userId);
    }

    @Transactional
    public void clear(Cart cart) {
        cart.getItems().clear();
        cartRepository.saveAndFlush(cart);
    }

    private Cart getOrCreate(Long userId) {
        return cartRepository
                .findByUserId(userId)
                .orElseGet(() -> {
                    Cart c = new Cart();
                    c.setUserId(userId);
                    return cartRepository.saveAndFlush(c);
                });
    }

    private Product activeProduct(Long productId) {
        Product p = productService.find(productId);
        if (!p.isActive()) {
            throw new BusinessRuleException("Product is not available: " + productId);
        }
        return p;
    }

    private void checkStock(Long productId, int quantity) {
        if (inventoryService.quantityOnHand(productId) < quantity) {
            throw new InsufficientStockException(productId, quantity);
        }
    }

    private CartItem findItem(Cart cart, Long productId) {
        return cart.getItems().stream()
                .filter(i -> i.getProduct().getId().equals(productId))
                .findFirst()
                .orElse(null);
    }

    private CartResponse toResponse(Cart cart) {
        Map<Long, Integer> stock =
                inventoryService.quantities(
                        cart.getItems().stream().map(i -> i.getProduct().getId()).toList());
        return mapper.toResponse(cart, stock);
    }
}
