package com.example.ecommerce.admin.service;

import com.example.ecommerce.admin.dto.DashboardStats;
import com.example.ecommerce.inventory.service.InventoryService;
import com.example.ecommerce.order.model.OrderStatus;
import com.example.ecommerce.user.model.Role;
import com.example.ecommerce.user.model.User;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Aggregate queries only: no entities are loaded. */
@Service
public class DashboardService {

    @PersistenceContext
    private EntityManager em;

    @Transactional(readOnly = true)
    public DashboardStats stats() {
        var revenueStatuses = OrderStatus.revenueStatuses();

        BigDecimal revenue = em.createQuery(
                        "select coalesce(sum(o.total), 0) from Order o where o.status in :s", BigDecimal.class)
                .setParameter("s", revenueStatuses).getSingleResult();
        long orderCount = em.createQuery("select count(o) from Order o", Long.class).getSingleResult();

        Map<OrderStatus, Long> byStatus = new EnumMap<>(OrderStatus.class);
        for (OrderStatus s : OrderStatus.values()) {
            byStatus.put(s, 0L);
        }
        em.createQuery("select o.status, count(o) from Order o group by o.status", Object[].class)
                .getResultList().forEach(r -> byStatus.put((OrderStatus) r[0], (Long) r[1]));

        long customers = em.createQuery("select count(u) from User u where u.role = :r", Long.class)
                .setParameter("r", Role.CUSTOMER).getSingleResult();
        long lowStock = em.createQuery("select count(i) from Inventory i where i.quantityOnHand <= :t", Long.class)
                .setParameter("t", InventoryService.LOW_STOCK_THRESHOLD).getSingleResult();

        return new DashboardStats(revenue, orderCount, byStatus, customers, lowStock, dailyRevenue(),
                topProducts());
    }

    @SuppressWarnings("unchecked")
    private List<DashboardStats.DailyRevenue> dailyRevenue() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate from = today.minusDays(29);
        List<Object[]> rows = em.createNativeQuery("""
                        select cast(created_at at time zone 'UTC' as date) as day, sum(total)
                          from orders
                         where status in ('PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED')
                           and created_at >= :from
                         group by day
                        """)
                .setParameter("from", from.atStartOfDay().toInstant(ZoneOffset.UTC))
                .getResultList();
        Map<LocalDate, BigDecimal> byDay = new TreeMap<>();
        for (LocalDate d = from; !d.isAfter(today); d = d.plusDays(1)) {
            byDay.put(d, BigDecimal.ZERO);
        }
        for (Object[] r : rows) {
            byDay.put(LocalDate.parse(String.valueOf(r[0])), new BigDecimal(String.valueOf(r[1])));
        }
        return byDay.entrySet().stream().map(e -> new DashboardStats.DailyRevenue(e.getKey(), e.getValue())).toList();
    }

    private List<DashboardStats.TopProduct> topProducts() {
        return em.createQuery("""
                        select oi.productId, oi.productName, sum(oi.quantity), sum(oi.unitPrice * oi.quantity)
                          from OrderItem oi join oi.order o
                         where o.status in :s
                         group by oi.productId, oi.productName
                         order by sum(oi.quantity) desc
                        """, Object[].class)
                .setParameter("s", OrderStatus.revenueStatuses())
                .setMaxResults(5)
                .getResultList().stream()
                .map(r -> new DashboardStats.TopProduct((Long) r[0], (String) r[1], ((Number) r[2]).longValue(),
                        (BigDecimal) r[3]))
                .toList();
    }
}
