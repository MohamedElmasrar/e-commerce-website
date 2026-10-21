package com.example.ecommerce.storage.validation;

import com.example.ecommerce.common.exception.BadRequestException;
import com.example.ecommerce.config.properties.StorageProperties;
import com.example.ecommerce.storage.model.ImageType;
import java.util.Arrays;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/** Validates uploaded images: declared type, size, and the real format via magic bytes. */
@Component
@RequiredArgsConstructor
public class FileValidator {

    private final StorageProperties properties;

    /**
     * @param declaredContentType the Content-Type sent by the client
     * @param content the full file content
     * @return the detected image type
     */
    public ImageType validate(String declaredContentType, byte[] content) {
        if (content == null || content.length == 0) {
            throw new BadRequestException("File is empty");
        }
        if (content.length > properties.maxImageBytesOrDefault()) {
            throw new BadRequestException("File exceeds the maximum size of " + properties.maxImageBytesOrDefault()
                    + " bytes");
        }
        ImageType declared = ImageType.fromContentType(declaredContentType)
                .orElseThrow(() -> new BadRequestException("Unsupported content type. Allowed: JPEG, PNG, WebP"));
        ImageType detected = detect(content);
        if (detected != declared) {
            throw new BadRequestException("File content does not match the declared content type");
        }
        return detected;
    }

    static ImageType detect(byte[] b) {
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) {
            return ImageType.JPEG;
        }
        byte[] png = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A};
        if (b.length >= png.length && Arrays.equals(Arrays.copyOf(b, png.length), png)) {
            return ImageType.PNG;
        }
        if (b.length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') {
            return ImageType.WEBP;
        }
        throw new BadRequestException("File is not a valid JPEG, PNG or WebP image");
    }
}
