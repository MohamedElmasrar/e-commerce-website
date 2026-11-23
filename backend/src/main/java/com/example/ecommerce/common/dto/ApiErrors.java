package com.example.ecommerce.common.dto;

import com.example.ecommerce.common.dto.ApiError.FieldError;
import com.example.ecommerce.common.filter.RequestIdFilter;
import java.time.Instant;
import java.util.List;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;

public final class ApiErrors {

    private ApiErrors() {}

    public static ApiError of(HttpStatus status, String message, String path) {
        return of(status, message, path, null);
    }

    public static ApiError of(
            HttpStatus status, String message, String path, List<FieldError> fields) {
        return new ApiError(
                Instant.now(),
                status.value(),
                status.getReasonPhrase(),
                message,
                path,
                MDC.get(RequestIdFilter.MDC_KEY),
                fields);
    }
}
