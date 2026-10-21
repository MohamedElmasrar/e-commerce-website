package com.example.ecommerce.storage.model;

import java.util.Arrays;
import java.util.Optional;

/** Accepted image formats with the extension used in object keys. */
public enum ImageType {
    JPEG("image/jpeg", "jpg"),
    PNG("image/png", "png"),
    WEBP("image/webp", "webp");

    private final String contentType;
    private final String extension;

    ImageType(String contentType, String extension) {
        this.contentType = contentType;
        this.extension = extension;
    }

    public String contentType() {
        return contentType;
    }

    public String extension() {
        return extension;
    }

    public static Optional<ImageType> fromContentType(String contentType) {
        if (contentType == null) {
            return Optional.empty();
        }
        return Arrays.stream(values()).filter(t -> t.contentType.equalsIgnoreCase(contentType.trim())).findFirst();
    }
}
