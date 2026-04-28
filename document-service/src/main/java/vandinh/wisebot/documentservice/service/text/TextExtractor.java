package vandinh.wisebot.documentservice.service.text;

import org.springframework.web.multipart.MultipartFile;
import java.io.InputStream;

public interface TextExtractor {
    String extract(MultipartFile file);
    String extract(InputStream inputStream);
}
