package vandinh.wisebot.documentservice.service.text;

import org.springframework.web.multipart.MultipartFile;
import java.io.ByteArrayInputStream;
import java.io.InputStream;

public interface TextExtractor {
    String extract(MultipartFile file);

    String extract(InputStream inputStream);

    /**
     * Extract text from byte content with filename (for Kreuzberg-aware extraction).
     * Default implementation delegates to extract(InputStream) for backward compatibility.
     */
    default String extract(byte[] content, String filename) {
        return extract(new ByteArrayInputStream(content));
    }
}
