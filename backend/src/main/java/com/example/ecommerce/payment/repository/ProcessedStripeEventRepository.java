package com.example.ecommerce.payment.repository;

import com.example.ecommerce.payment.model.ProcessedStripeEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProcessedStripeEventRepository extends JpaRepository<ProcessedStripeEvent, String> {

    /**
     * Records the event id. Returns 1 if this call inserted it, 0 if the event was already processed.
     * The primary key makes this race-free across concurrent deliveries.
     */
    @Modifying
    @Query(value = """
            INSERT INTO processed_stripe_events (event_id, event_type) VALUES (:eventId, :eventType)
            ON CONFLICT (event_id) DO NOTHING
            """, nativeQuery = true)
    int insertIfAbsent(@Param("eventId") String eventId, @Param("eventType") String eventType);
}
