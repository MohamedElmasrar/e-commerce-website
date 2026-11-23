package com.example.ecommerce.storage.validation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.example.ecommerce.common.exception.BadRequestException;
import com.example.ecommerce.config.properties.StorageProperties;
import com.example.ecommerce.storage.model.ImageType;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;

class FileValidatorTest {

    private final FileValidator validator = new FileValidator(new StorageProperties(1024L));

    static byte[] jpeg() {
        return new byte[] {
            (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 16, 'J', 'F', 'I', 'F'
        };
    }

    static byte[] png() {
        return new byte[] {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0};
    }

    static byte[] webp() {
        return "RIFF\0\0\0\0WEBPVP8 ".getBytes(StandardCharsets.ISO_8859_1);
    }

    @Test
    void acceptsRealJpegPngAndWebp() {
        assertThat(validator.validate("image/jpeg", jpeg())).isEqualTo(ImageType.JPEG);
        assertThat(validator.validate("image/png", png())).isEqualTo(ImageType.PNG);
        assertThat(validator.validate("image/webp", webp())).isEqualTo(ImageType.WEBP);
    }

    @Test
    void rejectsUnsupportedContentType() {
        assertThatThrownBy(() -> validator.validate("image/gif", jpeg()))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> validator.validate(null, jpeg()))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void rejectsOversizedFile() {
        byte[] big = new byte[2048];
        System.arraycopy(jpeg(), 0, big, 0, 4);
        assertThatThrownBy(() -> validator.validate("image/jpeg", big))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("maximum size");
    }

    @Test
    void rejectsEmptyFile() {
        assertThatThrownBy(() -> validator.validate("image/png", new byte[0]))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void rejectsContentThatLiesAboutItsType() {
        byte[] script = "<script>alert(1)</script>".getBytes(StandardCharsets.UTF_8);
        assertThatThrownBy(() -> validator.validate("image/png", script))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> validator.validate("image/png", jpeg()))
                .isInstanceOf(BadRequestException.class);
    }
}
