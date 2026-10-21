package com.example.ecommerce.order.service;

import com.example.ecommerce.cart.model.Cart;
import com.example.ecommerce.cart.model.CartItem;
import com.example.ecommerce.cart.service.CartService;
import com.example.ecommerce.common.dto.PageResponse;
import com.example.ecommerce.common.exception.BusinessRuleException;
import com.example.ecommerce.common.exception.NotFoundException;
import com.example.ecommerce.inventory.service.InventoryService;
import com.example.ecommerce.order.dto.OrderResponse;
import com.example.ecommerce.order.event.OrderCancelledEvent;
import com.example.ecommerce.order.dto.ShippingAddressRequest;
import com.example.ecommerce.order.mapper.OrderMapper;
import com.example.ecommerce.order.model.Order;
import com.example.ecommerce.order.model.OrderItem;
import com.example.ecommerce.order.model.OrderStatus;
import com.example.ecommerce.order.repository.OrderRepository;
import com.example.ecommerce.product.model.Product;
import com.example.ecommerce.product.service.ProductService;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartService cartService;
    private final ProductService productService;
    private final InventoryService inventoryService;
    private final OrderMapper mapper;
    private final ApplicationEventPublisher events;

    /**
     * Turns the user's cart into an order in one transaction: prices are re-read from the database,
     * stock is reserved atomically, and the cart is cleared. Any failure (for example insufficient
     * stock) rolls back every reservation made so far.
     */
    @Transactional
    public OrderResponse checkout(Long userId, ShippingAddressRequest shipping) {
        Cart cart = cartService.loadForCheckout(userId);
        if (cart.getItems().isEmpty()) {
            throw new BusinessRuleException("Cart is empty");
        }
        Order order = new Order();
        order.setUserId(userId);
        order.setStatus(OrderStatus.PENDING_PAYMENT);
        mapper.applyShipping(shipping, order);

        // Lock order is by product id so concurrent checkouts cannot deadlock on inventory rows.
        List<CartItem> items = cart.getItems().stream()
                .sorted(Comparator.comparing(i -> i.getProduct().getId())).toList();
        BigDecimal total = BigDecimal.ZERO;
        String currency = null;
        for (CartItem ci : items) {
            Product product = productService.find(ci.getProduct().getId()); // fresh price from the DB
            if (!product.isActive()) {
                throw new BusinessRuleException("Product is no longer available: " + product.getName());
            }
            if (currency == null) {
                currency = product.getCurrency();
            } else if (!currency.equals(product.getCurrency())) {
                throw new BusinessRuleException("All items in an order must use the same currency");
            }
            OrderItem oi = new OrderItem();
            oi.setOrder(order);
            oi.setProductId(product.getId());
            oi.setProductName(product.getName());
            oi.setSku(product.getSku());
            oi.setUnitPrice(product.getPrice());
            oi.setQuantity(ci.getQuantity());
            order.getItems().add(oi);
            total = total.add(product.getPrice().multiply(BigDecimal.valueOf(ci.getQuantity())));
        }
        order.setTotal(total);
        order.setCurrency(currency);
        orderRepository.saveAndFlush(order);

        String reference = "order:" + order.getId();
        for (OrderItem oi : order.getItems().stream().sorted(Comparator.comparing(OrderItem::getProductId)).toList()) {
            inventoryService.reserve(oi.getProductId(), oi.getQuantity(), reference);
        }
        cartService.clear(cart);
        return mapper.toResponse(order);
    }

    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> listForUser(Long userId, int page, int size) {
        return PageResponse.of(orderRepository.findByUserId(userId, pageable(page, size)), mapper::toResponse);
    }

    @Transactional(readOnly = true)
    public OrderResponse getForUser(Long userId, Long orderId) {
        return mapper.toResponse(findOwned(userId, orderId));
    }

    /** Loads an order owned by the user; another user's order looks like a missing one. */
    @Transactional(readOnly = true)
    public Order findOwned(Long userId, Long orderId) {
        return orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));
    }

    /** Like {@link #findOwned} but row-locks the order until the caller's transaction ends. */
    @Transactional
    public Order findOwnedForUpdate(Long userId, Long orderId) {
        findOwned(userId, orderId);
        return lock(orderId);
    }

    @Transactional
    public OrderResponse cancelOwn(Long userId, Long orderId) {
        findOwned(userId, orderId);
        Order order = lock(orderId);
        if (order.getStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new BusinessRuleException("Only orders awaiting payment can be cancelled by the customer");
        }
        transition(order, OrderStatus.CANCELLED);
        return mapper.toResponse(order);
    }

    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> listAll(OrderStatus status, int page, int size) {
        return PageResponse.of(orderRepository.findAllByStatus(status, pageable(page, size)), mapper::toResponse);
    }

    @Transactional(readOnly = true)
    public OrderResponse getAny(Long orderId) {
        return mapper.toResponse(orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found: " + orderId)));
    }

    @Transactional
    public OrderResponse updateStatus(Long orderId, OrderStatus next) {
        Order order = lock(orderId);
        transition(order, next);
        return mapper.toResponse(order);
    }

    /**
     * Called by the payment module when payment succeeded.
     *
     * @return true if this payment made the order PAID; false if the order cannot accept it (already
     *         paid, or cancelled) and the caller must refund the money
     */
    @Transactional
    public boolean markPaid(Long orderId) {
        Order order = lock(orderId);
        if (order.getStatus() == OrderStatus.PENDING_PAYMENT) {
            transition(order, OrderStatus.PAID);
            return true;
        }
        log.warn("Payment received for order {} in status {}; it will be refunded", orderId, order.getStatus());
        return false;
    }

    /** Called by the payment module when the checkout session expired. Releases stock. */
    @Transactional
    public void cancelUnpaid(Long orderId) {
        Order order = lock(orderId);
        if (order.getStatus() == OrderStatus.PENDING_PAYMENT) {
            transition(order, OrderStatus.CANCELLED);
        }
    }

    /** Cancels a PENDING_PAYMENT order created before the cutoff. Used by the stale order sweep. */
    @Transactional
    public boolean cancelIfStale(Long orderId, Instant cutoff) {
        Order order = lock(orderId);
        if (order.getStatus() != OrderStatus.PENDING_PAYMENT || !order.getCreatedAt().isBefore(cutoff)) {
            return false;
        }
        transition(order, OrderStatus.CANCELLED);
        return true;
    }

    @Transactional(readOnly = true)
    public List<Long> findStalePendingIds(Instant cutoff) {
        return orderRepository.findIdsByStatusAndCreatedAtBefore(OrderStatus.PENDING_PAYMENT, cutoff);
    }

    private void transition(Order order, OrderStatus next) {
        if (!order.getStatus().canTransitionTo(next)) {
            throw new BusinessRuleException("Cannot change order status from " + order.getStatus() + " to " + next);
        }
        order.setStatus(next);
        if (next == OrderStatus.CANCELLED) {
            String reference = "order:" + order.getId();
            order.getItems().stream().sorted(Comparator.comparing(OrderItem::getProductId))
                    .forEach(i -> inventoryService.release(i.getProductId(), i.getQuantity(), reference));
            events.publishEvent(new OrderCancelledEvent(order.getId()));
        }
        orderRepository.save(order);
    }

    private Order lock(Long orderId) {
        return orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));
    }

    private static Pageable pageable(int page, int size) {
        return PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by(Sort.Direction.DESC, "id")));
    }
}
