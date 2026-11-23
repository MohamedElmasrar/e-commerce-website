package com.example.ecommerce.category.service;

import com.example.ecommerce.category.dto.CategoryRequest;
import com.example.ecommerce.category.dto.CategoryResponse;
import com.example.ecommerce.category.mapper.CategoryMapper;
import com.example.ecommerce.category.model.Category;
import com.example.ecommerce.category.repository.CategoryProjection;
import com.example.ecommerce.category.repository.CategoryRepository;
import com.example.ecommerce.common.exception.BusinessRuleException;
import com.example.ecommerce.common.exception.ConflictException;
import com.example.ecommerce.common.exception.NotFoundException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository repository;
    private final CategoryMapper mapper;
    private final JdbcTemplate jdbc;

    /** Category tree (roots with nested children), each with its active product count. */
    @Transactional(readOnly = true)
    public List<CategoryResponse> tree() {
        List<CategoryProjection> all = repository.findAllWithProductCount();
        Map<Long, List<CategoryProjection>> byParent = new LinkedHashMap<>();
        for (CategoryProjection p : all) {
            byParent.computeIfAbsent(p.getParentId(), k -> new ArrayList<>()).add(p);
        }
        return build(null, byParent);
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> flat() {
        return repository.findAllWithProductCount().stream()
                .map(p -> mapper.toResponse(p, List.of()))
                .toList();
    }

    @Transactional
    public CategoryResponse create(CategoryRequest request) {
        if (repository.existsBySlug(request.slug())) {
            throw new ConflictException("Category slug already exists: " + request.slug());
        }
        validateParent(request.parentId(), null);
        Category c = new Category();
        mapper.apply(request, c);
        return mapper.toResponse(repository.save(c), 0);
    }

    @Transactional
    public CategoryResponse update(Long id, CategoryRequest request) {
        Category c = find(id);
        if (repository.existsBySlugAndIdNot(request.slug(), id)) {
            throw new ConflictException("Category slug already exists: " + request.slug());
        }
        validateParent(request.parentId(), id);
        mapper.apply(request, c);
        return mapper.toResponse(repository.save(c), countProducts(id));
    }

    @Transactional
    public void delete(Long id) {
        Category c = find(id);
        if (countProducts(id) > 0) {
            throw new ConflictException("Category still has products");
        }
        if (repository.existsByParentId(id)) {
            throw new ConflictException("Category still has child categories");
        }
        repository.delete(c);
    }

    public Category find(Long id) {
        return repository
                .findById(id)
                .orElseThrow(() -> new NotFoundException("Category not found: " + id));
    }

    private long countProducts(Long categoryId) {
        Long n =
                jdbc.queryForObject(
                        "select count(*) from products where category_id = ?",
                        Long.class,
                        categoryId);
        return n == null ? 0 : n;
    }

    private void validateParent(Long parentId, Long selfId) {
        if (parentId == null) {
            return;
        }
        if (parentId.equals(selfId)) {
            throw new BusinessRuleException("A category cannot be its own parent");
        }
        find(parentId);
    }

    private List<CategoryResponse> build(
            Long parentId, Map<Long, List<CategoryProjection>> byParent) {
        return byParent.getOrDefault(parentId, List.of()).stream()
                .map(p -> mapper.toResponse(p, build(p.getId(), byParent)))
                .toList();
    }
}
