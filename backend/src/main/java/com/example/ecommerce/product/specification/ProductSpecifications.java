package com.example.ecommerce.product.specification;

import com.example.ecommerce.category.model.Category;
import com.example.ecommerce.inventory.model.Inventory;
import com.example.ecommerce.product.model.Product;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.data.jpa.domain.Specification;

public final class ProductSpecifications {

    private ProductSpecifications() {
    }

    public static Specification<Product> from(ProductFilter f) {
        return (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (!f.includeInactive()) {
                p.add(cb.isTrue(root.get("active")));
            }
            if (f.q() != null && !f.q().isBlank()) {
                String like = "%" + escape(f.q().trim().toLowerCase(Locale.ROOT)) + "%";
                p.add(cb.or(
                        cb.like(cb.lower(root.get("name")), like, '\\'),
                        cb.like(cb.lower(cb.coalesce(root.<String>get("description"), "")), like, '\\')));
            }
            if (f.categoryId() != null) {
                p.add(cb.equal(root.get("category").get("id"), f.categoryId()));
            }
            if (f.categorySlug() != null && !f.categorySlug().isBlank()) {
                Join<Product, Category> c = root.join("category", JoinType.INNER);
                p.add(cb.equal(c.get("slug"), f.categorySlug()));
            }
            if (f.minPrice() != null) {
                p.add(cb.greaterThanOrEqualTo(root.get("price"), f.minPrice()));
            }
            if (f.maxPrice() != null) {
                p.add(cb.lessThanOrEqualTo(root.get("price"), f.maxPrice()));
            }
            if (f.inStock() != null) {
                Subquery<Long> sq = query.subquery(Long.class);
                Root<Inventory> inv = sq.from(Inventory.class);
                sq.select(inv.get("id")).where(
                        cb.equal(inv.get("productId"), root.get("id")),
                        cb.greaterThan(inv.get("quantityOnHand"), 0));
                p.add(f.inStock() ? cb.exists(sq) : cb.not(cb.exists(sq)));
            }
            return cb.and(p.toArray(Predicate[]::new));
        };
    }

    private static String escape(String s) {
        return s.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
