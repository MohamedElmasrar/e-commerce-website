package com.example.ecommerce.product.controller;

import com.example.ecommerce.common.dto.PageResponse;
import com.example.ecommerce.product.dto.AdminProductResponse;
import com.example.ecommerce.product.dto.ProductRequest;
import com.example.ecommerce.product.dto.ReorderImagesRequest;
import com.example.ecommerce.product.service.ProductService;
import com.example.ecommerce.product.specification.ProductFilter;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/admin/products")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminProductController {

    private final ProductService productService;

    /** Same filters as the public list, but includes inactive products. */
    @GetMapping
    public PageResponse<AdminProductResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Boolean inStock) {
        return productService.searchForAdmin(new ProductFilter(q, categoryId, null, minPrice, maxPrice, inStock, true),
                page, size, sort);
    }

    @GetMapping("/{id}")
    public AdminProductResponse get(@PathVariable Long id) {
        return productService.getById(id);
    }

    @PostMapping
    public ResponseEntity<AdminProductResponse> create(@Valid @RequestBody ProductRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.create(request));
    }

    @PutMapping("/{id}")
    public AdminProductResponse update(@PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        return productService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        productService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(path = "/{id}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AdminProductResponse> addImage(@PathVariable Long id,
                                                         @RequestPart("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.addImage(id, file));
    }

    @DeleteMapping("/{id}/images/{imageId}")
    public AdminProductResponse deleteImage(@PathVariable Long id, @PathVariable Long imageId) {
        return productService.deleteImage(id, imageId);
    }

    @PutMapping("/{id}/images/order")
    public AdminProductResponse reorderImages(@PathVariable Long id, @Valid @RequestBody ReorderImagesRequest request) {
        return productService.reorderImages(id, request.imageIds());
    }
}
