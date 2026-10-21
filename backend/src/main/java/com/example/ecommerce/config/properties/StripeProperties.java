package com.example.ecommerce.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.stripe")
public record StripeProperties(
        String secretKey,
        String webhookSecret,
        String successUrl,
        String cancelUrl) {
}
