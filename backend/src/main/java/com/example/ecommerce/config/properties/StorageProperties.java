package com.example.ecommerce.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.storage")
public record StorageProperties(Long maxImageBytes) {

    public long maxImageBytesOrDefault() {
        return maxImageBytes == null ? 5L * 1024 * 1024 : maxImageBytes;
    }
}
