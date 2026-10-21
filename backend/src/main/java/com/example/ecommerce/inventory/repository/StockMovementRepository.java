package com.example.ecommerce.inventory.repository;

import com.example.ecommerce.inventory.model.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
}
