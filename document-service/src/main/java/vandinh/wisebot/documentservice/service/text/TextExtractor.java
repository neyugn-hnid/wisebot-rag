package vandinh.wisebot.documentservice.service.text;

import org.springframework.web.multipart.MultipartFile;

public interface TextExtractor {
    String extract(MultipartFile file);
}
