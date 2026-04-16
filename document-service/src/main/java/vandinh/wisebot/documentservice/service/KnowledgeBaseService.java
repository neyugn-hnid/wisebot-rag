package vandinh.wisebot.documentservice.service;

import vandinh.wisebot.documentservice.dto.request.KnowledgeBaseRequest;
import vandinh.wisebot.documentservice.dto.response.KnowledgeBaseResponse;

import java.util.List;
import java.util.UUID;

public interface KnowledgeBaseService {
    KnowledgeBaseResponse create(KnowledgeBaseRequest request);
    KnowledgeBaseResponse getById(UUID id);
    List<KnowledgeBaseResponse> listAll();
    KnowledgeBaseResponse update(UUID id, KnowledgeBaseRequest request);
    void delete(UUID id);
}
