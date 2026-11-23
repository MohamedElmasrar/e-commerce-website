package com.example.ecommerce.storage.service;

import com.example.ecommerce.common.exception.NotFoundException;
import com.example.ecommerce.storage.model.StoredObject;
import java.io.InputStream;

/** Abstraction over the object store (SeaweedFS through the S3 API). */
public interface StorageService {

    /** Stores the content under the given key. */
    void put(String key, InputStream content, long size, String contentType);

    /** Opens the object. Throws {@link NotFoundException} if absent. */
    StoredObject get(String key);

    /** Deletes the object. Deleting a missing key is not an error. */
    void delete(String key);
}
