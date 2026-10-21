package com.example.ecommerce.order.scheduler;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.ecommerce.order.service.OrderService;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class StaleOrderSweeperTest {

    @Mock OrderService orderService;

    @Test
    void cancelsEveryStaleOrderAndContinuesAfterAFailure() {
        Instant now = Instant.parse("2026-01-01T12:00:00Z");
        Instant cutoff = now.minus(Duration.ofMinutes(60));
        when(orderService.findStalePendingIds(cutoff)).thenReturn(List.of(1L, 2L, 3L));
        when(orderService.cancelIfStale(1L, cutoff)).thenThrow(new IllegalStateException("boom"));
        when(orderService.cancelIfStale(2L, cutoff)).thenReturn(true);
        when(orderService.cancelIfStale(3L, cutoff)).thenReturn(false);

        int cancelled = new StaleOrderSweeper(orderService, Duration.ofMinutes(60)).sweep(now);

        assertThat(cancelled).isEqualTo(1);
        verify(orderService).cancelIfStale(3L, cutoff);
    }

    @Test
    void nothingToDoWhenNoOrderIsStale() {
        Instant now = Instant.now();
        when(orderService.findStalePendingIds(any())).thenReturn(List.of());
        assertThat(new StaleOrderSweeper(orderService, Duration.ofMinutes(60)).sweep(now)).isZero();
        verify(orderService, never()).cancelIfStale(any(), any());
    }
}
