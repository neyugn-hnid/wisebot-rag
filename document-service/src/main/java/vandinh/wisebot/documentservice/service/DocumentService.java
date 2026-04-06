package vandinh.wisebot.documentservice.service;

import org.springframework.web.multipart.MultipartFile;
import vandinh.wisebot.documentservice.common.enums.DocumentStatus;
import vandinh.wisebot.documentservice.dto.response.DocumentChunkResponse;
import vandinh.wisebot.documentservice.dto.response.DocumentResponse;
import vandinh.wisebot.documentservice.dto.response.DocumentUploadResponse;
import vandinh.wisebot.documentservice.entity.Document;

import java.util.List;
import java.util.UUID;

public interface DocumentService {
    DocumentUploadResponse upload(UUID knowledgeBaseId, MultipartFile file);
    List<DocumentUploadResponse> uploadBulk(UUID knowledgeBaseId, List<MultipartFile> files);
    DocumentResponse getMetadata(UUID id);
    List<DocumentResponse> listByKnowledgeBase(UUID knowledgeBaseId);
    void delete(UUID id);
    Document getDocument(UUID id);
    DocumentStatus getStatus(UUID id);
    DocumentResponse reprocess(UUID id);
    String getPreview(UUID id);
    List<DocumentChunkResponse> getChunks(UUID id);
    List<DocumentChunkResponse> search(UUID knowledgeBaseId, String query);
    boolean isStorageEnabled();
}
