package com.example.ecommerce.storage.config;

import com.example.ecommerce.config.properties.S3Properties;
import com.example.ecommerce.storage.service.S3StorageService;
import com.example.ecommerce.storage.service.StorageService;
import java.net.URI;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;
import software.amazon.awssdk.services.s3.model.S3Exception;

@Slf4j
@Configuration
public class StorageConfig {

    @Bean
    public S3Client s3Client(S3Properties props) {
        return S3Client.builder()
                .endpointOverride(URI.create(props.endpoint()))
                .region(Region.of(props.region()))
                .credentialsProvider(
                        StaticCredentialsProvider.create(
                                AwsBasicCredentials.create(props.accessKey(), props.secretKey())))
                .serviceConfiguration(
                        S3Configuration.builder().pathStyleAccessEnabled(props.pathStyle()).build())
                .build();
    }

    @Bean
    public StorageService storageService(S3Client s3Client, S3Properties props) {
        return new S3StorageService(s3Client, props);
    }

    /** Creates the bucket on startup if it is missing. A failure is logged, not fatal. */
    @Bean
    public ApplicationRunner bucketInitializer(S3Client s3Client, S3Properties props) {
        return args -> ensureBucket(s3Client, props.bucket());
    }

    static void ensureBucket(S3Client s3, String bucket) {
        try {
            try {
                s3.headBucket(HeadBucketRequest.builder().bucket(bucket).build());
            } catch (S3Exception e) {
                if (!(e instanceof NoSuchBucketException) && e.statusCode() != 404) {
                    throw e;
                }
                s3.createBucket(CreateBucketRequest.builder().bucket(bucket).build());
                log.info("Created storage bucket {}", bucket);
            }
        } catch (RuntimeException e) {
            log.warn("Could not verify or create storage bucket {}: {}", bucket, e.getMessage());
        }
    }
}
