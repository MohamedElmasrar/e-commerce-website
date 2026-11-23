package com.example.ecommerce.inventory.service;

import com.example.ecommerce.common.exception.BusinessRuleException;
import com.example.ecommerce.common.exception.NotFoundException;
import com.example.ecommerce.inventory.exception.InsufficientStockException;
import com.example.ecommerce.inventory.model.Inventory;
import com.example.ecommerce.inventory.model.StockMovement;
import com.example.ecommerce.inventory.model.StockReason;
import com.example.ecommerce.inventory.repository.InventoryRepository;
import com.example.ecommerce.inventory.repository.StockMovementRepository;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Stock management. Every change goes through one atomic conditional UPDATE so that concurrent
 * checkouts can never push the quantity below zero.
 */
@Service
@RequiredArgsConstructor
public class InventoryService {

    public static final int LOW_STOCK_THRESHOLD = 5;

    private final InventoryRepository inventoryRepository;
    private final StockMovementRepository movementRepository;

    /** Creates the inventory row for a new product. */
    @Transactional
    public void initialize(Long productId, int quantity) {
        Inventory inv = new Inventory();
        inv.setProductId(productId);
        inv.setQuantityOnHand(quantity);
        inventoryRepository.save(inv);
        record(productId, quantity, StockReason.INITIAL, null);
    }

    /**
     * Reserves stock for an order. Throws {@link InsufficientStockException} if not enough is
     * available.
     */
    @Transactional
    public void reserve(Long productId, int quantity, String reference) {
        requirePositive(quantity);
        if (inventoryRepository.applyDelta(productId, -quantity) == 0) {
            throw new InsufficientStockException(productId, quantity);
        }
        record(productId, -quantity, StockReason.ORDER_RESERVE, reference);
    }

    /** Returns reserved stock (cancelled or expired order). */
    @Transactional
    public void release(Long productId, int quantity, String reference) {
        requirePositive(quantity);
        if (inventoryRepository.applyDelta(productId, quantity) == 0) {
            throw new NotFoundException("No inventory for product " + productId);
        }
        record(productId, quantity, StockReason.ORDER_RELEASE, reference);
    }

    /** Manual adjustment by an admin. A negative delta cannot take the quantity below zero. */
    @Transactional
    public void adjust(Long productId, int delta, String note) {
        if (delta == 0) {
            throw new BusinessRuleException("Adjustment must not be zero");
        }
        if (inventoryRepository.applyDelta(productId, delta) == 0) {
            if (inventoryRepository.findByProductId(productId).isEmpty()) {
                throw new NotFoundException("No inventory for product " + productId);
            }
            throw new BusinessRuleException("Adjustment would make stock negative");
        }
        record(productId, delta, StockReason.ADMIN_ADJUSTMENT, note);
    }

    @Transactional(readOnly = true)
    public int quantityOnHand(Long productId) {
        return inventoryRepository
                .findByProductId(productId)
                .map(Inventory::getQuantityOnHand)
                .orElse(0);
    }

    /** Batch lookup, one query for any number of products. Missing rows are reported as 0. */
    @Transactional(readOnly = true)
    public Map<Long, Integer> quantities(Collection<Long> productIds) {
        Map<Long, Integer> result = new HashMap<>();
        if (productIds.isEmpty()) {
            return result;
        }
        inventoryRepository
                .findQuantities(productIds)
                .forEach(q -> result.put(q.getProductId(), q.getQuantityOnHand()));
        productIds.forEach(id -> result.putIfAbsent(id, 0));
        return result;
    }

    private void record(Long productId, int delta, StockReason reason, String reference) {
        StockMovement m = new StockMovement();
        m.setProductId(productId);
        m.setDelta(delta);
        m.setReason(reason);
        m.setReference(reference);
        movementRepository.save(m);
    }

    private static void requirePositive(int quantity) {
        if (quantity <= 0) {
            throw new BusinessRuleException("Quantity must be positive");
        }
    }
}
