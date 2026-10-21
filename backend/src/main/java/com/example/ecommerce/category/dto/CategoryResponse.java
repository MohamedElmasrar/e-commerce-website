package com.example.ecommerce.category.dto;

import java.util.List;

public record CategoryResponse(Long id, String name, String slug, String description, Long parentId,
                               long productCount, List<CategoryResponse> children) {
}
