package com.example.ecommerce.product.controller;

import com.example.ecommerce.common.dto.PageResponse;
import com.example.ecommerce.product.dto.ProductResponse;
import com.example.ecommerce.product.service.ProductService;
import com.example.ecommerce.product.specification.ProductFilter;
import com.example.ecommerce.storage.model.StoredObject;
import java.math.BigDecimal;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public PageResponse<ProductResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Boolean inStock) {
        return productService.search(new ProductFilter(q, categoryId, category, minPrice, maxPrice, inStock, false),
                page, size, sort);
    }

    @GetMapping("/{slug}")
    public ProductResponse get(@PathVariable String slug) {
        return productService.getBySlug(slug);
    }

    /** Image bytes streamed from the object store. Keys are random UUIDs, so responses are cacheable forever. */
    @GetMapping("/images/{key}")
    public ResponseEntity<InputStreamResource> image(@PathVariable String key) {
        StoredObject object = productService.openImage(key);
        ResponseEntity.BodyBuilder builder = ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable())
                .contentType(MediaType.parseMediaType(object.contentType()));
        if (object.size() >= 0) {
            builder.contentLength(object.size());
        }
        return builder.body(new InputStreamResource(object.content()));
    }
}
