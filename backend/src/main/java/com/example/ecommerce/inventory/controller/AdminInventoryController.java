package com.example.ecommerce.inventory.controller;

import com.example.ecommerce.common.dto.PageResponse;
import com.example.ecommerce.common.exception.NotFoundException;
import com.example.ecommerce.inventory.dto.AdjustStockRequest;
import com.example.ecommerce.inventory.dto.InventoryResponse;
import com.example.ecommerce.inventory.repository.InventoryRepository;
import com.example.ecommerce.inventory.repository.InventoryRow;
import com.example.ecommerce.inventory.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/inventory")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminInventoryController {

    private final InventoryRepository inventoryRepository;
    private final InventoryService inventoryService;

    @GetMapping
    public PageResponse<InventoryResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "false") boolean lowStock) {
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100));
        return PageResponse.of(
                inventoryRepository.findRows(
                        lowStock ? InventoryService.LOW_STOCK_THRESHOLD : null, pageable),
                this::toResponse);
    }

    @PostMapping("/{productId}/adjust")
    public ResponseEntity<InventoryResponse> adjust(
            @PathVariable Long productId, @Valid @RequestBody AdjustStockRequest request) {
        inventoryService.adjust(productId, request.delta(), request.note());
        return ResponseEntity.ok(
                toResponse(
                        inventoryRepository
                                .findRow(productId)
                                .orElseThrow(() ->
                                        new NotFoundException(
                                                "No inventory for product " + productId))));
    }

    private InventoryResponse toResponse(InventoryRow r) {
        return new InventoryResponse(
                r.getProductId(),
                r.getSku(),
                r.getName(),
                r.getQuantityOnHand(),
                r.getQuantityOnHand() <= InventoryService.LOW_STOCK_THRESHOLD);
    }
}
