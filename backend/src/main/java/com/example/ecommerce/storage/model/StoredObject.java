package com.example.ecommerce.storage.model;

import java.io.InputStream;

/** Object content streamed from the store. The caller must close the stream. */
public record StoredObject(InputStream content, String contentType, long size) {}
