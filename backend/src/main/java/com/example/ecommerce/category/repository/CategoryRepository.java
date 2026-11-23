package com.example.ecommerce.category.repository;

import com.example.ecommerce.category.model.Category;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);

    boolean existsByParentId(Long parentId);

    @Query(
            value =
                    """
                    select c.id as id, c.name as name, c.slug as slug, c.description as description,
                           c.parent_id as parentId,
                           (select count(*) from products p where p.category_id = c.id and p.active = true) as productCount
                    from categories c order by c.name
                    """,
            nativeQuery = true)
    List<CategoryProjection> findAllWithProductCount();
}
