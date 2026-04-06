package vandinh.wisebot.documentservice.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vandinh.wisebot.documentservice.dto.request.KnowledgeBaseRequest;
import vandinh.wisebot.documentservice.dto.response.KnowledgeBaseResponse;
import vandinh.wisebot.documentservice.entity.KnowledgeBase;
import vandinh.wisebot.documentservice.exception.ResourceNotFoundException;
import vandinh.wisebot.documentservice.repository.KnowledgeBaseRepository;
import vandinh.wisebot.documentservice.service.KnowledgeBaseService;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class KnowledgeBaseServiceImpl implements KnowledgeBaseService {

    private final KnowledgeBaseRepository knowledgeBaseRepository;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public KnowledgeBaseResponse create(KnowledgeBaseRequest request) {
        KnowledgeBase kb = KnowledgeBase.builder()
                .name(request.getName())
                .description(request.getDescription())
                .tenantId(request.getTenantId())
                .build();
        KnowledgeBase saved = knowledgeBaseRepository.save(kb);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public KnowledgeBaseResponse getById(UUID id) {
        KnowledgeBase kb = knowledgeBaseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Knowledge base not found: " + id));
        return toResponse(kb);
    }

    @Override
    @Transactional(readOnly = true)
    public List<KnowledgeBaseResponse> listAll() {
        return knowledgeBaseRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public KnowledgeBaseResponse update(UUID id, KnowledgeBaseRequest request) {
        KnowledgeBase kb = knowledgeBaseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Knowledge base not found: " + id));
        kb.setName(request.getName());
        kb.setDescription(request.getDescription());
        kb.setTenantId(request.getTenantId());
        return toResponse(knowledgeBaseRepository.save(kb));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(UUID id) {
        KnowledgeBase kb = knowledgeBaseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Knowledge base not found: " + id));
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
