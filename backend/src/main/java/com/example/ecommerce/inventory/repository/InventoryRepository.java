package com.example.ecommerce.inventory.repository;

import com.example.ecommerce.inventory.model.Inventory;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    Optional<Inventory> findByProductId(Long productId);

    /**
     * Atomically applies a stock delta. The WHERE clause guarantees the quantity never goes below
     * zero, so concurrent reservations cannot oversell. Returns the number of rows updated (0 means
     * insufficient stock or unknown product).
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(
            value =
                    """
                    UPDATE inventory
                       SET quantity_on_hand = quantity_on_hand + :delta, version = version + 1, updated_at = now()
                     WHERE product_id = :productId AND quantity_on_hand + :delta >= 0
                    """,
            nativeQuery = true)
    int applyDelta(@Param("productId") Long productId, @Param("delta") int delta);

    @Query(
            "select i.productId as productId, i.quantityOnHand as quantityOnHand from Inventory i "
                    + "where i.productId in :ids")
    List<StockQuantity> findQuantities(@Param("ids") Collection<Long> ids);

    @Query(
            value =
                    """
                    select i.product_id as productId, p.sku as sku, p.name as name, i.quantity_on_hand as quantityOnHand
                      from inventory i join products p on p.id = i.product_id
                     where i.product_id = :productId
                    """,
            nativeQuery = true)
    Optional<InventoryRow> findRow(@Param("productId") Long productId);

    @Query(
            value =
                    """
                    select i.product_id as productId, p.sku as sku, p.name as name, i.quantity_on_hand as quantityOnHand
                      from inventory i join products p on p.id = i.product_id
                     where (cast(:lowStockThreshold as integer) is null or i.quantity_on_hand <= cast(:lowStockThreshold as integer))
                     order by i.quantity_on_hand, p.name
                    """,
            countQuery =
                    """
                    select count(*) from inventory i
                     where (cast(:lowStockThreshold as integer) is null or i.quantity_on_hand <= cast(:lowStockThreshold as integer))
                    """,
            nativeQuery = true)
    Page<InventoryRow> findRows(
            @Param("lowStockThreshold") Integer lowStockThreshold, Pageable pageable);
}
