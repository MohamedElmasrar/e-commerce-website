package com.example.ecommerce.admin.dto;

import com.example.ecommerce.order.model.OrderStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public record DashboardStats(
        BigDecimal totalRevenue,
        long orderCount,
        Map<OrderStatus, Long> ordersByStatus,
        long customerCount,
        long lowStockCount,
        List<DailyRevenue> revenueLast30Days,
        List<TopProduct> topProducts) {

    public record DailyRevenue(LocalDate date, BigDecimal revenue) {}

    public record TopProduct(Long productId, String name, long unitsSold, BigDecimal revenue) {}
}
