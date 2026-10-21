package com.example.ecommerce.product.mapper;

import com.example.ecommerce.product.dto.AdminProductResponse;
import com.example.ecommerce.product.dto.ProductRequest;
import com.example.ecommerce.product.dto.ProductResponse;
import com.example.ecommerce.product.dto.ProductResponse.CategorySummary;
import com.example.ecommerce.product.dto.ProductResponse.ImageResponse;
import com.example.ecommerce.product.model.Product;
import com.example.ecommerce.product.model.ProductImage;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class ProductMapper {

    public static final String IMAGE_URL_PREFIX = "/api/v1/products/images/";

    public ProductResponse toResponse(Product p, int stock) {
        List<ImageResponse> images = p.getImages().stream()
                .sorted(java.util.Comparator.comparingInt(ProductImage::getPosition))
                .map(i -> new ImageResponse(i.getId(), IMAGE_URL_PREFIX + i.getObjectKey(), i.getPosition()))
                .toList();
        return new ProductResponse(p.getId(), p.getSku(), p.getSlug(), p.getName(), p.getDescription(),
                p.getPrice(), p.getCurrency(),
                p.isActive(),
                new CategorySummary(p.getCategory().getId(), p.getCategory().getName(), p.getCategory().getSlug()),
                images, stock > 0, p.getCreatedAt());
    }

    public AdminProductResponse toAdminResponse(Product p, int stock) {
        return new AdminProductResponse(toResponse(p, stock), stock);
    }

    public void apply(ProductRequest r, Product p) {
        p.setSku(r.sku().trim());
        p.setName(r.name().trim());
        p.setDescription(r.description());
        p.setPrice(r.price());
        p.setCurrency(r.currency());
        if (r.active() != null) {
            p.setActive(r.active());
        }
    }
}
