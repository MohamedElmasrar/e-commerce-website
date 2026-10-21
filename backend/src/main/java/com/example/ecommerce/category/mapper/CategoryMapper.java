package com.example.ecommerce.category.mapper;

import com.example.ecommerce.category.dto.CategoryRequest;
import com.example.ecommerce.category.dto.CategoryResponse;
import com.example.ecommerce.category.model.Category;
import com.example.ecommerce.category.repository.CategoryProjection;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class CategoryMapper {

    public CategoryResponse toResponse(CategoryProjection p, List<CategoryResponse> children) {
        return new CategoryResponse(p.getId(), p.getName(), p.getSlug(), p.getDescription(), p.getParentId(),
                p.getProductCount() == null ? 0 : p.getProductCount(), children);
    }

    public CategoryResponse toResponse(Category c, long productCount) {
        return new CategoryResponse(c.getId(), c.getName(), c.getSlug(), c.getDescription(), c.getParentId(),
                productCount, List.of());
    }

    public void apply(CategoryRequest request, Category c) {
        c.setName(request.name().trim());
        c.setSlug(request.slug());
        c.setDescription(request.description());
        c.setParentId(request.parentId());
    }
}
