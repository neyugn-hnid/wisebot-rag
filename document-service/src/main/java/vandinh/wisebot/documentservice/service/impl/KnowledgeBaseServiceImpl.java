package vandinh.wisebot.documentservice.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vandinh.wisebot.documentservice.dto.request.KnowledgeBaseRequest;
import vandinh.wisebot.documentservice.dto.response.KnowledgeBaseResponse;
import vandinh.wisebot.documentservice.entity.Document;
import vandinh.wisebot.documentservice.entity.KnowledgeBase;
import vandinh.wisebot.documentservice.exception.InvalidDataException;
import vandinh.wisebot.documentservice.exception.ResourceNotFoundException;
import vandinh.wisebot.documentservice.repository.DocumentChunkRepository;
import vandinh.wisebot.documentservice.repository.DocumentRepository;
import vandinh.wisebot.documentservice.repository.KnowledgeBaseRepository;
import vandinh.wisebot.documentservice.service.BillingEntitlementService;
import vandinh.wisebot.documentservice.service.KnowledgeBaseService;
import vandinh.wisebot.documentservice.service.embedding.EmbeddingClient;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class KnowledgeBaseServiceImpl implements KnowledgeBaseService {

    private final KnowledgeBaseRepository knowledgeBaseRepository;
    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final BillingEntitlementService billingEntitlementService;
    private final EmbeddingClient embeddingClient;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public KnowledgeBaseResponse create(KnowledgeBaseRequest request, UUID tenantId) {
        var entitlement = billingEntitlementService.getKnowledgeBaseLimit(tenantId);
        long currentCount = knowledgeBaseRepository.countByTenantId(tenantId);
        if (!entitlement.isUnlimited() && currentCount >= entitlement.getKnowledgeBaseLimit()) {
            throw new InvalidDataException("Gói hiện tại chỉ cho phép tạo tối đa "
                    + entitlement.getKnowledgeBaseLimit()
                    + " cơ sở tri thức. Vui lòng nâng cấp gói để tạo thêm.");
        }

        KnowledgeBase kb = KnowledgeBase.builder()
                .name(request.getName())
                .description(request.getDescription())
                .tenantId(tenantId)
                .build();
        KnowledgeBase saved = knowledgeBaseRepository.save(kb);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public KnowledgeBaseResponse getById(UUID id, UUID tenantId) {
        KnowledgeBase kb = knowledgeBaseRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Knowledge base not found: " + id));
        return toResponse(kb);
    }

    @Override
    @Transactional(readOnly = true)
    public List<KnowledgeBaseResponse> listAll(UUID tenantId) {
        return knowledgeBaseRepository.findAllByTenantId(tenantId).stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public KnowledgeBaseResponse update(UUID id, KnowledgeBaseRequest request, UUID tenantId) {
        KnowledgeBase kb = knowledgeBaseRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Knowledge base not found: " + id));
        kb.setName(request.getName());
        kb.setDescription(request.getDescription());
        return toResponse(knowledgeBaseRepository.save(kb));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(UUID id, UUID tenantId) {
        KnowledgeBase kb = knowledgeBaseRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Knowledge base not found: " + id));

        // Xóa tất cả document chunks và documents thuộc KB này
        List<Document> documents = documentRepository.findAllByKnowledgeBase_Id(id);
        for (Document doc : documents) {
            embeddingClient.deleteDocumentEmbeddings(tenantId, id, doc.getId());
            documentChunkRepository.deleteAllByDocument_Id(doc.getId());
            documentRepository.delete(doc);
        }

        knowledgeBaseRepository.delete(kb);
    }

    private KnowledgeBaseResponse toResponse(KnowledgeBase kb) {
        return KnowledgeBaseResponse.builder()
                .id(kb.getId())
                .name(kb.getName())
                .description(kb.getDescription())
                .tenantId(kb.getTenantId())
                .createdAt(kb.getCreatedAt())
                .build();
    }
}
