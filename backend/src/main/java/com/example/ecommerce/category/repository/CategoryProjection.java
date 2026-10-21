package com.example.ecommerce.category.repository;

/** Category row with the number of active products, loaded in one aggregate query. */
public interface CategoryProjection {
    Long getId();

    String getName();

    String getSlug();

    String getDescription();

    Long getParentId();

    Long getProductCount();
}
