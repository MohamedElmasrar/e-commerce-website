package com.example.ecommerce.product.repository;

import com.example.ecommerce.product.model.Product;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.lang.NonNull;

public interface ProductRepository
        extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    /** Category is fetched in the same query; images are batch fetched afterwards. */
    @Override
    @EntityGraph(attributePaths = "category")
    @NonNull
    Page<Product> findAll(Specification<Product> spec, @NonNull Pageable pageable);

    @EntityGraph(attributePaths = "category")
    Optional<Product> findBySlug(String slug);

    @EntityGraph(attributePaths = "category")
    Optional<Product> findWithCategoryById(Long id);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);

    boolean existsBySku(String sku);

    boolean existsBySkuAndIdNot(String sku, Long id);
}
