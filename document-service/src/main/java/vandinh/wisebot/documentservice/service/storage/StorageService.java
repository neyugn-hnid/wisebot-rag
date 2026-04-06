package vandinh.wisebot.documentservice.service.storage;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface StorageService {
    String store(UUID knowledgeBaseId, MultipartFile file);
    Resource loadAsResource(String storagePath);
}
