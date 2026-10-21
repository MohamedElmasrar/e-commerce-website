package com.example.ecommerce.storage.service;

import com.example.ecommerce.common.exception.NotFoundException;
import com.example.ecommerce.config.properties.S3Properties;
import com.example.ecommerce.storage.model.StoredObject;
import java.io.InputStream;
import lombok.RequiredArgsConstructor;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@RequiredArgsConstructor
public class S3StorageService implements StorageService {

    private final S3Client s3;
    private final S3Properties properties;

    @Override
    public void put(String key, InputStream content, long size, String contentType) {
        s3.putObject(PutObjectRequest.builder()
                        .bucket(properties.bucket()).key(key).contentType(contentType).contentLength(size).build(),
                RequestBody.fromInputStream(content, size));
    }

    @Override
    public StoredObject get(String key) {
        try {
            ResponseInputStream<GetObjectResponse> in = s3.getObject(
                    GetObjectRequest.builder().bucket(properties.bucket()).key(key).build());
            GetObjectResponse r = in.response();
            return new StoredObject(in, r.contentType(), r.contentLength() == null ? -1 : r.contentLength());
        } catch (NoSuchKeyException e) {
            throw new NotFoundException("Object not found: " + key);
        }
    }

    @Override
    public void delete(String key) {
        s3.deleteObject(DeleteObjectRequest.builder().bucket(properties.bucket()).key(key).build());
    }
}
