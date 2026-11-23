package com.example.ecommerce.order.scheduler;

import com.example.ecommerce.order.service.OrderService;
import java.time.Duration;
import java.time.Instant;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Cancels orders that never got paid, so abandoned checkouts do not hold stock forever. */
@Slf4j
@Component
public class StaleOrderSweeper {

    private final OrderService orderService;
    private final Duration pendingTimeout;

    public StaleOrderSweeper(
            OrderService orderService,
            @Value("${app.orders.pending-timeout:60m}") Duration pendingTimeout) {
        this.orderService = orderService;
        this.pendingTimeout = pendingTimeout;
    }

    @Scheduled(
            fixedDelayString = "${app.orders.sweep-interval-ms:300000}",
            initialDelayString = "${app.orders.sweep-interval-ms:300000}")
    public void sweep() {
        sweep(Instant.now());
    }

    int sweep(Instant now) {
        Instant cutoff = now.minus(pendingTimeout);
        int cancelled = 0;
        for (Long id : orderService.findStalePendingIds(cutoff)) {
            try {
                if (orderService.cancelIfStale(id, cutoff)) {
                    cancelled++;
                }
            } catch (RuntimeException e) {
                log.warn("Could not cancel stale order {}: {}", id, e.getMessage());
            }
        }
        if (cancelled > 0) {
            log.info("Cancelled {} unpaid orders older than {}", cancelled, pendingTimeout);
        }
        return cancelled;
    }
}
