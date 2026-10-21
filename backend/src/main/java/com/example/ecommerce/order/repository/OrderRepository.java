package com.example.ecommerce.order.repository;

import com.example.ecommerce.order.model.Order;
import com.example.ecommerce.order.model.OrderStatus;
import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepository extends JpaRepository<Order, Long> {

    Page<Order> findByUserId(Long userId, Pageable pageable);

    Optional<Order> findByIdAndUserId(Long id, Long userId);

    @Query("select o from Order o where (:status is null or o.status = :status)")
    Page<Order> findAllByStatus(@Param("status") OrderStatus status, Pageable pageable);

    @Query("select o.id from Order o where o.status = :status and o.createdAt < :cutoff")
    List<Long> findIdsByStatusAndCreatedAtBefore(@Param("status") OrderStatus status,
                                                 @Param("cutoff") Instant cutoff);

    /** Row lock so concurrent webhook and admin status changes serialize. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from Order o where o.id = :id")
    Optional<Order> findByIdForUpdate(@Param("id") Long id);
}
