package com.example.ecommerce.product.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record ReorderImagesRequest(@NotEmpty List<Long> imageIds) {
}
