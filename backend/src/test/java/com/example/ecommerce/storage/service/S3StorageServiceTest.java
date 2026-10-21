package com.example.ecommerce.storage.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.ecommerce.common.exception.NotFoundException;
import com.example.ecommerce.config.properties.S3Properties;
import com.example.ecommerce.storage.model.StoredObject;
import com.example.ecommerce.storage.service.S3StorageService;
import java.io.ByteArrayInputStream;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.http.AbortableInputStream;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

class S3StorageServiceTest {

    private final S3Client s3 = mock(S3Client.class);
    private final S3StorageService storage =
            new S3StorageService(s3, new S3Properties("http://x", "us-east-1", "media", "a", "b", true));

    @Test
    void putSendsBucketKeyContentTypeAndLength() {
        storage.put("k.jpg", new ByteArrayInputStream(new byte[5]), 5, "image/jpeg");

        ArgumentCaptor<PutObjectRequest> req = ArgumentCaptor.forClass(PutObjectRequest.class);
        verify(s3).putObject(req.capture(), any(RequestBody.class));
        assertThat(req.getValue().bucket()).isEqualTo("media");
        assertThat(req.getValue().key()).isEqualTo("k.jpg");
        assertThat(req.getValue().contentType()).isEqualTo("image/jpeg");
        assertThat(req.getValue().contentLength()).isEqualTo(5L);
    }

    @Test
    @SuppressWarnings("unchecked")
    void getReturnsStreamAndMetadata() {
        GetObjectResponse meta = GetObjectResponse.builder().contentType("image/png").contentLength(3L).build();
        when(s3.getObject(any(GetObjectRequest.class))).thenReturn(
                new ResponseInputStream<>(meta, AbortableInputStream.create(new ByteArrayInputStream(new byte[3]))));

        StoredObject o = storage.get("k.png");

        assertThat(o.contentType()).isEqualTo("image/png");
        assertThat(o.size()).isEqualTo(3);
    }

    @Test
    void getMissingKeyIsNotFound() {
        when(s3.getObject(any(GetObjectRequest.class))).thenThrow(NoSuchKeyException.builder().build());
        assertThatThrownBy(() -> storage.get("nope")).isInstanceOf(NotFoundException.class);
    }

    @Test
    void deleteTargetsConfiguredBucket() {
        storage.delete("k.jpg");
        ArgumentCaptor<DeleteObjectRequest> req = ArgumentCaptor.forClass(DeleteObjectRequest.class);
        verify(s3).deleteObject(req.capture());
        assertThat(req.getValue().bucket()).isEqualTo("media");
        assertThat(req.getValue().key()).isEqualTo("k.jpg");
    }
}
