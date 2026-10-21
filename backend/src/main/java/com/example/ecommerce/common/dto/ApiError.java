package com.example.ecommerce.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path,
        String requestId,
        List<FieldError> fieldErrors) {

    public record FieldError(String field, String message) {
    }
}
