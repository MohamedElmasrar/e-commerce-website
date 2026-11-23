package com.example.ecommerce;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.example.ecommerce.cart.service.CartService;
import com.example.ecommerce.common.dto.PageResponse;
import com.example.ecommerce.inventory.exception.InsufficientStockException;
import com.example.ecommerce.inventory.service.InventoryService;
import com.example.ecommerce.order.dto.OrderResponse;
import com.example.ecommerce.order.dto.ShippingAddressRequest;
import com.example.ecommerce.order.service.OrderService;
import com.example.ecommerce.product.dto.ProductResponse;
import com.example.ecommerce.product.service.ProductService;
import com.example.ecommerce.product.specification.ProductFilter;
import jakarta.persistence.EntityManagerFactory;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicInteger;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Database-backed tests on the seeded schema. Skipped automatically when Docker is not available;
 * run them with Docker via {@code mvn verify}.
 */
@Testcontainers(disabledWithoutDocker = true)
@SpringBootTest(properties = "spring.jpa.properties.hibernate.generate_statistics=true")
@ActiveProfiles("test")
class ShopIntegrationTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Autowired JdbcTemplate jdbc;
    @Autowired InventoryService inventoryService;
    @Autowired OrderService orderService;
    @Autowired CartService cartService;
    @Autowired ProductService productService;
    @Autowired EntityManagerFactory emf;

    private final ShippingAddressRequest address =
            new ShippingAddressRequest(
                    "Jane", "1 Main St", null, "Springfield", "IL", "62701", "US");

    private long customerId() {
        return jdbc.queryForObject(
                "select id from users where email = 'customer@example.com'", Long.class);
    }

    private long productWithStock(int stock) {
        long id =
                jdbc.queryForObject(
                        "select id from products order by id limit 1 offset ?",
                        Long.class,
                        (int) (Math.random() * 20));
        jdbc.update(
                "update inventory set quantity_on_hand = ?, reserved = 0 where product_id = ?",
                stock,
                id);
        return id;
    }

    @Test
    void concurrentReservationsOfLastUnitsNeverOversell() throws Exception {
        int stock = 5;
        int threads = 30;
        long productId = productWithStock(stock);
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch start = new CountDownLatch(1);
        AtomicInteger ok = new AtomicInteger();
        AtomicInteger rejected = new AtomicInteger();
        List<Future<?>> futures = new ArrayList<>();
        for (int i = 0; i < threads; i++) {
            futures.add(
                    pool.submit(() -> {
                        start.await();
                        try {
                            inventoryService.reserve(productId, 1, "race");
                            ok.incrementAndGet();
                        } catch (InsufficientStockException e) {
                            rejected.incrementAndGet();
                        }
                        return null;
                    }));
        }
        start.countDown();
        for (Future<?> f : futures) {
            f.get();
        }
        pool.shutdown();

        assertThat(ok.get()).isEqualTo(stock);
        assertThat(rejected.get()).isEqualTo(threads - stock);
        assertThat(inventoryService.quantityOnHand(productId)).isZero();
    }

    @Test
    void checkoutUsesDatabasePricesReservesStockAndClearsCart() {
        long productId = productWithStock(10);
        BigDecimal price =
                jdbc.queryForObject(
                        "select price from products where id = ?", BigDecimal.class, productId);
        long userId = customerId();
        cartService.clear(userId);
        cartService.addItem(userId, productId, 3);

        OrderResponse order = orderService.checkout(userId, address);

        assertThat(order.total()).isEqualByComparingTo(price.multiply(BigDecimal.valueOf(3)));
        assertThat(inventoryService.quantityOnHand(productId)).isEqualTo(7);
        assertThat(cartService.get(userId).items()).isEmpty();
    }

    @Test
    void insufficientStockRollsBackTheWholeCheckout() {
        long userId = customerId();
        long a = productWithStock(10);
        long b =
                jdbc.queryForObject(
                        "select id from products where id <> ? order by id limit 1", Long.class, a);
        jdbc.update("update inventory set quantity_on_hand = 1 where product_id = ?", b);
        cartService.clear(userId);
        cartService.addItem(userId, a, 2);
        cartService.addItem(userId, b, 1);
        jdbc.update(
                "update inventory set quantity_on_hand = 0 where product_id = ?",
                b); // sold out meanwhile
        int ordersBefore = jdbc.queryForObject("select count(*) from orders", Integer.class);

        assertThatThrownBy(() -> orderService.checkout(userId, address))
                .isInstanceOf(InsufficientStockException.class);

        assertThat(jdbc.queryForObject("select count(*) from orders", Integer.class))
                .isEqualTo(ordersBefore);
        assertThat(inventoryService.quantityOnHand(a)).isEqualTo(10);
        assertThat(cartService.get(userId).items()).hasSize(2);
    }

    @Test
    void productListFiltersSortsPaginatesWithConstantQueryCount() {
        Statistics stats = emf.unwrap(SessionFactory.class).getStatistics();

        stats.clear();
        PageResponse<ProductResponse> small =
                productService.search(
                        new ProductFilter(null, null, null, null, null, null, false),
                        0,
                        5,
                        "price,asc");
        long queriesFor5 = stats.getPrepareStatementCount();
        stats.clear();
        PageResponse<ProductResponse> large =
                productService.search(
                        new ProductFilter(null, null, null, null, null, null, false),
                        0,
                        30,
                        "price,asc");
        long queriesFor30 = stats.getPrepareStatementCount();

        assertThat(small.content()).hasSize(5);
        assertThat(large.totalElements()).isGreaterThanOrEqualTo(30);
        assertThat(queriesFor30)
                .as("no N+1: query count independent of page size")
                .isEqualTo(queriesFor5)
                .isLessThanOrEqualTo(5);
        assertThat(large.content()).extracting(ProductResponse::price).isSorted();

        PageResponse<ProductResponse> priced =
                productService.search(
                        new ProductFilter(
                                null,
                                null,
                                null,
                                new BigDecimal("5"),
                                new BigDecimal("10"),
                                true,
                                false),
                        0,
                        100,
                        "name,asc");
        assertThat(priced.content())
                .allSatisfy(p -> {
                    assertThat(p.price()).isBetween(new BigDecimal("5"), new BigDecimal("10"));
                    assertThat(p.inStock()).isTrue();
                });
    }
}
