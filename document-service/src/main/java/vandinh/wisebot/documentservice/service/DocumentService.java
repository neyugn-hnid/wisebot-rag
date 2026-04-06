package vandinh.wisebot.documentservice.service;

import org.springframework.web.multipart.MultipartFile;
import vandinh.wisebot.documentservice.dto.response.DocumentResponse;

import java.util.UUID;

public interface DocumentService {
    DocumentResponse upload(MultipartFile file);
    DocumentResponse getMetadata(UUID id);
    void delete(UUID id);
    boolean isStorageEnabled();
}
