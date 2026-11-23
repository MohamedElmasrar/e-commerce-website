package com.example.ecommerce.order.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.ecommerce.cart.model.Cart;
import com.example.ecommerce.cart.model.CartItem;
import com.example.ecommerce.cart.service.CartService;
import com.example.ecommerce.category.model.Category;
import com.example.ecommerce.common.exception.BusinessRuleException;
import com.example.ecommerce.inventory.exception.InsufficientStockException;
import com.example.ecommerce.inventory.service.InventoryService;
import com.example.ecommerce.order.dto.OrderResponse;
import com.example.ecommerce.order.dto.ShippingAddressRequest;
import com.example.ecommerce.order.event.OrderCancelledEvent;
import com.example.ecommerce.order.mapper.OrderMapper;
import com.example.ecommerce.order.model.Order;
import com.example.ecommerce.order.model.OrderItem;
import com.example.ecommerce.order.model.OrderStatus;
import com.example.ecommerce.order.repository.OrderRepository;
import com.example.ecommerce.product.model.Product;
import com.example.ecommerce.product.service.ProductService;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock OrderRepository orderRepository;
    @Mock CartService cartService;
    @Mock ProductService productService;
    @Mock InventoryService inventoryService;
    @Mock ApplicationEventPublisher events;

    OrderService service;
    final ShippingAddressRequest address =
            new ShippingAddressRequest(
                    "Jane", "1 Main St", null, "Springfield", "IL", "62701", "US");

    @BeforeEach
    void setUp() {
        service =
                new OrderService(
                        orderRepository,
                        cartService,
                        productService,
                        inventoryService,
                        new OrderMapper(),
                        events);
    }

    private Product product(long id, String price) {
        Product p = new Product();
        p.setId(id);
        p.setSku("SKU-" + id);
        p.setName("Product " + id);
        p.setPrice(new BigDecimal(price));
        p.setCurrency("USD");
        p.setActive(true);
        p.setCategory(new Category());
        return p;
    }

    private Cart cartWith(Product stale, int qty) {
        Cart cart = new Cart();
        cart.setUserId(1L);
        CartItem item = new CartItem();
        item.setCart(cart);
        item.setProduct(stale);
        item.setQuantity(qty);
        cart.getItems().add(item);
        return cart;
    }

    @Test
    void checkoutUsesCurrentDatabasePricesReservesStockAndClearsCart() {
        Product stale = product(10, "1.00"); // price held by the cart's stale entity
        Product fresh = product(10, "19.99"); // price currently in the database
        Cart cart = cartWith(stale, 3);
        when(cartService.loadForCheckout(1L)).thenReturn(cart);
        when(productService.find(10L)).thenReturn(fresh);
        when(orderRepository.saveAndFlush(any(Order.class)))
                .thenAnswer(inv -> {
                    Order o = inv.getArgument(0);
                    o.setId(55L);
                    return o;
                });

        OrderResponse response = service.checkout(1L, address);

        assertThat(response.total()).isEqualByComparingTo("59.97");
        assertThat(response.status()).isEqualTo(OrderStatus.PENDING_PAYMENT);
        assertThat(response.items()).hasSize(1);
        assertThat(response.items().get(0).unitPrice()).isEqualByComparingTo("19.99");
        verify(inventoryService).reserve(10L, 3, "order:55");
        verify(cartService).clear(cart);
    }

    @Test
    void insufficientStockPropagatesAndCartIsNotCleared() {
        Cart cart = cartWith(product(10, "5.00"), 99);
        when(cartService.loadForCheckout(1L)).thenReturn(cart);
        when(productService.find(10L)).thenReturn(product(10, "5.00"));
        when(orderRepository.saveAndFlush(any(Order.class)))
                .thenAnswer(inv -> {
                    Order o = inv.getArgument(0);
                    o.setId(1L);
                    return o;
                });
        doThrow(new InsufficientStockException(10L, 99))
                .when(inventoryService)
                .reserve(eq(10L), eq(99), anyString());

        assertThatThrownBy(() -> service.checkout(1L, address))
                .isInstanceOf(InsufficientStockException.class);
        verify(cartService, never()).clear(any(Cart.class));
    }

    @Test
    void emptyCartIsRejected() {
        when(cartService.loadForCheckout(1L)).thenReturn(new Cart());
        assertThatThrownBy(() -> service.checkout(1L, address))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void cancellingReleasesStock() {
        Order order = new Order();
        order.setId(5L);
        order.setStatus(OrderStatus.PENDING_PAYMENT);
        OrderItem item = new OrderItem();
        item.setProductId(10L);
        item.setQuantity(2);
        item.setUnitPrice(BigDecimal.TEN);
        order.getItems().add(item);
        when(orderRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(order));

        service.updateStatus(5L, OrderStatus.CANCELLED);

        assertThat(order.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        verify(inventoryService).release(10L, 2, "order:5");
    }

    @Test
    void invalidTransitionIsRejected() {
        Order order = new Order();
        order.setId(5L);
        order.setStatus(OrderStatus.DELIVERED);
        when(orderRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(order));
        assertThatThrownBy(() -> service.updateStatus(5L, OrderStatus.PAID))
                .isInstanceOf(BusinessRuleException.class);
        verify(inventoryService, never()).release(any(), anyInt(), any());
    }

    private Order pending(Instant createdAt) {
        Order order = new Order();
        order.setId(5L);
        order.setStatus(OrderStatus.PENDING_PAYMENT);
        order.setCreatedAt(createdAt);
        OrderItem item = new OrderItem();
        item.setProductId(10L);
        item.setQuantity(2);
        item.setUnitPrice(BigDecimal.TEN);
        order.getItems().add(item);
        return order;
    }

    @Test
    void markPaidReportsWhetherThePaymentWasAccepted() {
        Order order = pending(Instant.now());
        when(orderRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(order));
        assertThat(service.markPaid(5L)).isTrue();
        assertThat(order.getStatus()).isEqualTo(OrderStatus.PAID);
        // A second payment for an already paid order must be refunded by the caller.
        assertThat(service.markPaid(5L)).isFalse();
    }

    @Test
    void markPaidOnCancelledOrderIsRejectedSoCallerRefunds() {
        Order order = pending(Instant.now());
        order.setStatus(OrderStatus.CANCELLED);
        when(orderRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(order));
        assertThat(service.markPaid(5L)).isFalse();
        assertThat(order.getStatus()).isEqualTo(OrderStatus.CANCELLED);
    }

    @Test
    void cancellationPublishesEventSoOpenPaymentSessionsAreClosed() {
        Order order = pending(Instant.now());
        when(orderRepository.findByIdAndUserId(5L, 1L)).thenReturn(Optional.of(order));
        when(orderRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(order));

        service.cancelOwn(1L, 5L);

        verify(events).publishEvent(new OrderCancelledEvent(5L));
    }

    @Test
    void staleOrderIsCancelledAndStockReleased() {
        Instant now = Instant.now();
        Order order = pending(now.minus(Duration.ofHours(2)));
        when(orderRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(order));

        assertThat(service.cancelIfStale(5L, now.minus(Duration.ofHours(1)))).isTrue();

        assertThat(order.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        verify(inventoryService).release(10L, 2, "order:5");
    }

    @Test
    void recentOrderIsNotCancelledBySweep() {
        Instant now = Instant.now();
        Order order = pending(now.minus(Duration.ofMinutes(5)));
        when(orderRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(order));

        assertThat(service.cancelIfStale(5L, now.minus(Duration.ofHours(1)))).isFalse();

        assertThat(order.getStatus()).isEqualTo(OrderStatus.PENDING_PAYMENT);
        verify(inventoryService, never()).release(any(), anyInt(), any());
    }
}
