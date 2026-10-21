package com.example.ecommerce.category.controller;

import com.example.ecommerce.category.dto.CategoryResponse;
import com.example.ecommerce.category.service.CategoryService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    /** Returns a nested tree by default, or a flat list with {@code ?flat=true}. */
    @GetMapping
    public List<CategoryResponse> list(@RequestParam(defaultValue = "false") boolean flat) {
        return flat ? categoryService.flat() : categoryService.tree();
    }
}
