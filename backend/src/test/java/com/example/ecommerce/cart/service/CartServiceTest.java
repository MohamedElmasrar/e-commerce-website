package com.example.ecommerce.cart.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.when;

import com.example.ecommerce.cart.mapper.CartMapper;
import com.example.ecommerce.cart.model.Cart;
import com.example.ecommerce.cart.model.CartItem;
import com.example.ecommerce.cart.repository.CartRepository;
import com.example.ecommerce.inventory.service.InventoryService;
import com.example.ecommerce.product.model.Product;
import com.example.ecommerce.product.service.ProductService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CartServiceTest {

    @Mock CartRepository cartRepository;
    @Mock ProductService productService;
    @Mock InventoryService inventoryService;
    @Mock CartMapper mapper;

    @Test
    void loadForCheckoutTakesTheCartRowLockBeforeReadingItems() {
        Cart cart = new Cart();
        cart.setUserId(1L);
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(cartRepository.findByUserIdForUpdate(1L)).thenReturn(Optional.of(cart));

        Cart loaded =
                new CartService(cartRepository, productService, inventoryService, mapper)
                        .loadForCheckout(1L);

        assertThat(loaded).isSameAs(cart);
        InOrder order = inOrder(cartRepository);
        order.verify(cartRepository).findByUserIdForUpdate(1L);
        order.verify(cartRepository).findByUserId(1L);
    }

    @Test
    void cartShowsWhetherQuantityCanIncreaseWithoutStockCount() {
        Product product = new Product();
        product.setId(10L);
        product.setPrice(new BigDecimal("3.00"));
        product.setCurrency("USD");
        Cart cart = new Cart();
        CartItem item = new CartItem();
        item.setProduct(product);
        item.setQuantity(2);
        cart.getItems().add(item);
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(inventoryService.quantities(List.of(10L))).thenReturn(Map.of(10L, 3), Map.of(10L, 2));

        CartService service =
                new CartService(cartRepository, productService, inventoryService, new CartMapper());
        ObjectMapper json = new ObjectMapper();
        JsonNode belowStock = json.valueToTree(service.get(1L).items().getFirst());
        JsonNode atStock = json.valueToTree(service.get(1L).items().getFirst());

        assertThat(belowStock.get("canIncreaseQuantity").booleanValue()).isTrue();
        assertThat(atStock.get("canIncreaseQuantity").booleanValue()).isFalse();
        assertThat(atStock.has("availableStock")).isFalse();
    }
}
