package vandinh.wisebot.documentservice.service;

import vandinh.wisebot.documentservice.dto.request.KnowledgeBaseRequest;
import vandinh.wisebot.documentservice.dto.response.KnowledgeBaseResponse;

import java.util.List;
import java.util.UUID;

public interface KnowledgeBaseService {
    KnowledgeBaseResponse create(KnowledgeBaseRequest request, UUID tenantId);
    KnowledgeBaseResponse getById(UUID id, UUID tenantId);
    List<KnowledgeBaseResponse> listAll(UUID tenantId);
    KnowledgeBaseResponse update(UUID id, KnowledgeBaseRequest request, UUID tenantId);
    void delete(UUID id, UUID tenantId);
}
