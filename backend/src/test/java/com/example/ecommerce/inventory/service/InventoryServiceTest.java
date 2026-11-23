package com.example.ecommerce.inventory.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.ecommerce.common.exception.BusinessRuleException;
import com.example.ecommerce.common.exception.NotFoundException;
import com.example.ecommerce.inventory.exception.InsufficientStockException;
import com.example.ecommerce.inventory.model.Inventory;
import com.example.ecommerce.inventory.model.StockMovement;
import com.example.ecommerce.inventory.model.StockReason;
import com.example.ecommerce.inventory.repository.InventoryRepository;
import com.example.ecommerce.inventory.repository.StockMovementRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock InventoryRepository inventoryRepository;
    @Mock StockMovementRepository movementRepository;
    @InjectMocks InventoryService service;

    @Test
    void reserveUsesAtomicConditionalUpdateAndRecordsMovement() {
        when(inventoryRepository.applyDelta(7L, -3)).thenReturn(1);

        service.reserve(7L, 3, "order:1");

        ArgumentCaptor<StockMovement> m = ArgumentCaptor.forClass(StockMovement.class);
        verify(movementRepository).save(m.capture());
        assertThat(m.getValue().getDelta()).isEqualTo(-3);
        assertThat(m.getValue().getReason()).isEqualTo(StockReason.ORDER_RESERVE);
        assertThat(m.getValue().getReference()).isEqualTo("order:1");
    }

    @Test
    void reserveFailsWhenConditionalUpdateAffectsNoRows() {
        when(inventoryRepository.applyDelta(7L, -50)).thenReturn(0);

        assertThatThrownBy(() -> service.reserve(7L, 50, "order:1"))
                .isInstanceOf(InsufficientStockException.class);
        verify(movementRepository, never()).save(any());
    }

    @Test
    void reserveRejectsNonPositiveQuantity() {
        assertThatThrownBy(() -> service.reserve(7L, 0, "x"))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void releaseAddsStockBack() {
        when(inventoryRepository.applyDelta(7L, 2)).thenReturn(1);
        service.release(7L, 2, "order:1");
        verify(inventoryRepository).applyDelta(7L, 2);
    }

    @Test
    void negativeAdjustmentBelowZeroIsRejected() {
        when(inventoryRepository.applyDelta(7L, -10)).thenReturn(0);
        when(inventoryRepository.findByProductId(7L)).thenReturn(Optional.of(new Inventory()));
        assertThatThrownBy(() -> service.adjust(7L, -10, "n"))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void adjustingUnknownProductIsNotFound() {
        when(inventoryRepository.applyDelta(9L, 5)).thenReturn(0);
        when(inventoryRepository.findByProductId(9L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.adjust(9L, 5, "n")).isInstanceOf(NotFoundException.class);
    }
}
