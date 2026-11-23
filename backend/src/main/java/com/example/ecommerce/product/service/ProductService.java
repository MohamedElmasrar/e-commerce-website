package com.example.ecommerce.product.service;

import com.example.ecommerce.category.service.CategoryService;
import com.example.ecommerce.common.dto.PageResponse;
import com.example.ecommerce.common.exception.BadRequestException;
import com.example.ecommerce.common.exception.ConflictException;
import com.example.ecommerce.common.exception.NotFoundException;
import com.example.ecommerce.inventory.service.InventoryService;
import com.example.ecommerce.product.dto.AdminProductResponse;
import com.example.ecommerce.product.dto.ProductRequest;
import com.example.ecommerce.product.dto.ProductResponse;
import com.example.ecommerce.product.mapper.ProductMapper;
import com.example.ecommerce.product.model.Product;
import com.example.ecommerce.product.model.ProductImage;
import com.example.ecommerce.product.repository.ProductRepository;
import com.example.ecommerce.product.specification.ProductFilter;
import com.example.ecommerce.product.specification.ProductSpecifications;
import com.example.ecommerce.storage.model.ImageType;
import com.example.ecommerce.storage.model.StoredObject;
import com.example.ecommerce.storage.service.StorageService;
import com.example.ecommerce.storage.validation.FileValidator;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.text.Normalizer;
import java.text.Normalizer.Form;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.BiFunction;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {

    public static final int MAX_PAGE_SIZE = 100;
    private static final Set<String> SORTABLE = Set.of("price", "name", "createdAt");
    private static final Pattern IMAGE_KEY =
            Pattern.compile(
                    "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(jpg|png|webp)$");

    private final ProductRepository productRepository;
    private final ProductMapper mapper;
    private final CategoryService categoryService;
    private final InventoryService inventoryService;
    private final StorageService storageService;
    private final FileValidator fileValidator;

    /**
     * Builds the page request: size capped at 100, sort limited to a whitelist ("field,asc|desc").
     */
    public static Pageable pageable(int page, int size, String sort) {
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        String[] parts = (sort == null || sort.isBlank() ? "createdAt,desc" : sort).split(",");
        String field = parts[0].trim();
        if (!SORTABLE.contains(field)) {
            throw new BadRequestException(
                    "Unsupported sort field. Allowed: price, name, createdAt");
        }
        Direction dir = Direction.ASC;
        if (parts.length > 1) {
            String d = parts[1].trim().toLowerCase(Locale.ROOT);
            if (d.equals("desc")) {
                dir = Direction.DESC;
            } else if (!d.equals("asc")) {
                throw new BadRequestException("Sort direction must be asc or desc");
            }
        }
        return PageRequest.of(Math.max(page, 0), safeSize, Sort.by(dir, field).and(Sort.by("id")));
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> search(
            ProductFilter filter, int page, int size, String sort) {
        return search(filter, page, size, sort, mapper::toResponse);
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminProductResponse> searchForAdmin(
            ProductFilter filter, int page, int size, String sort) {
        return search(filter, page, size, sort, mapper::toAdminResponse);
    }

    private <T> PageResponse<T> search(
            ProductFilter filter,
            int page,
            int size,
            String sort,
            BiFunction<Product, Integer, T> toResponse) {
        Page<Product> result =
                productRepository.findAll(
                        ProductSpecifications.from(filter), pageable(page, size, sort));
        Map<Long, Integer> stock =
                inventoryService.quantities(
                        result.getContent().stream().map(Product::getId).toList());
        return PageResponse.of(result, p -> toResponse.apply(p, stock.getOrDefault(p.getId(), 0)));
    }

    @Transactional(readOnly = true)
    public ProductResponse getBySlug(String slug) {
        Product p =
                productRepository
                        .findBySlug(slug)
                        .filter(Product::isActive)
                        .orElseThrow(() -> new NotFoundException("Product not found: " + slug));
        return mapper.toResponse(p, inventoryService.quantityOnHand(p.getId()));
    }

    @Transactional(readOnly = true)
    public AdminProductResponse getById(Long id) {
        return toAdminResponse(find(id));
    }

    @Transactional
    public AdminProductResponse create(ProductRequest r) {
        String slug = r.slug() != null && !r.slug().isBlank() ? r.slug() : slugify(r.name());
        if (productRepository.existsBySlug(slug)) {
            throw new ConflictException("Product slug already exists: " + slug);
        }
        if (productRepository.existsBySku(r.sku().trim())) {
            throw new ConflictException("Product SKU already exists: " + r.sku());
        }
        Product p = new Product();
        mapper.apply(r, p);
        p.setSlug(slug);
        p.setCategory(categoryService.find(r.categoryId()));
        productRepository.saveAndFlush(p);
        inventoryService.initialize(p.getId(), r.initialStock() == null ? 0 : r.initialStock());
        return toAdminResponse(p);
    }

    @Transactional
    public AdminProductResponse update(Long id, ProductRequest r) {
        Product p = find(id);
        String slug = r.slug() != null && !r.slug().isBlank() ? r.slug() : p.getSlug();
        if (productRepository.existsBySlugAndIdNot(slug, id)) {
            throw new ConflictException("Product slug already exists: " + slug);
        }
        if (productRepository.existsBySkuAndIdNot(r.sku().trim(), id)) {
            throw new ConflictException("Product SKU already exists: " + r.sku());
        }
        mapper.apply(r, p);
        p.setSlug(slug);
        p.setCategory(categoryService.find(r.categoryId()));
        productRepository.saveAndFlush(p);
        return toAdminResponse(p);
    }

    @Transactional
    public void delete(Long id) {
        Product p = find(id);
        List<String> keys = p.getImages().stream().map(ProductImage::getObjectKey).toList();
        productRepository.delete(p);
        productRepository.flush(); // surfaces FK violations (product is part of an order) as 409
        keys.forEach(this::deleteObjectQuietly);
    }

    @Transactional
    public AdminProductResponse addImage(Long productId, MultipartFile file) {
        Product p = find(productId);
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new BadRequestException("Could not read uploaded file");
        }
        ImageType type = fileValidator.validate(file.getContentType(), bytes);
        String key = UUID.randomUUID() + "." + type.extension();
        storageService.put(key, new ByteArrayInputStream(bytes), bytes.length, type.contentType());
        try {
            ProductImage img = new ProductImage();
            img.setProduct(p);
            img.setObjectKey(key);
            img.setContentType(type.contentType());
            img.setSizeBytes(bytes.length);
            img.setPosition(
                    p.getImages().stream().mapToInt(ProductImage::getPosition).max().orElse(-1)
                            + 1);
            p.getImages().add(img);
            productRepository.saveAndFlush(p);
        } catch (RuntimeException e) {
            deleteObjectQuietly(key);
            throw e;
        }
        return toAdminResponse(p);
    }

    @Transactional
    public AdminProductResponse deleteImage(Long productId, Long imageId) {
        Product p = find(productId);
        ProductImage img =
                p.getImages().stream()
                        .filter(i -> i.getId().equals(imageId))
                        .findFirst()
                        .orElseThrow(() -> new NotFoundException("Image not found: " + imageId));
        p.getImages().remove(img);
        productRepository.saveAndFlush(p);
        deleteObjectQuietly(img.getObjectKey());
        return toAdminResponse(p);
    }

    @Transactional
    public AdminProductResponse reorderImages(Long productId, List<Long> imageIds) {
        Product p = find(productId);
        Set<Long> existing = new HashSet<>();
        p.getImages().forEach(i -> existing.add(i.getId()));
        if (imageIds.size() != existing.size() || !existing.equals(new HashSet<>(imageIds))) {
            throw new BadRequestException("imageIds must contain exactly the product's image ids");
        }
        for (ProductImage img : p.getImages()) {
            img.setPosition(imageIds.indexOf(img.getId()));
        }
        productRepository.saveAndFlush(p);
        return toAdminResponse(p);
    }

    /** Streams an image from the store. The key format is validated to prevent path tricks. */
    public StoredObject openImage(String key) {
        if (!IMAGE_KEY.matcher(key).matches()) {
            throw new NotFoundException("Image not found");
        }
        return storageService.get(key);
    }

    public Product find(Long id) {
        return productRepository
                .findWithCategoryById(id)
                .orElseThrow(() -> new NotFoundException("Product not found: " + id));
    }

    private AdminProductResponse toAdminResponse(Product p) {
        return mapper.toAdminResponse(p, inventoryService.quantityOnHand(p.getId()));
    }

    private void deleteObjectQuietly(String key) {
        try {
            storageService.delete(key);
        } catch (RuntimeException e) {
            log.warn("Could not delete object {}: {}", key, e.getMessage());
        }
    }

    static String slugify(String name) {
        String s =
                Normalizer.normalize(name, Form.NFD)
                        .replaceAll("\\p{M}", "")
                        .toLowerCase(Locale.ROOT)
                        .replaceAll("[^a-z0-9]+", "-")
                        .replaceAll("(^-|-$)", "");
        return s.isEmpty() ? UUID.randomUUID().toString() : s;
    }
}
