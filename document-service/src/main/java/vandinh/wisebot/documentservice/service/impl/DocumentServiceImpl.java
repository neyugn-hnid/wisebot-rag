package vandinh.wisebot.documentservice.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;
import vandinh.wisebot.documentservice.common.enums.DocumentStatus;
import vandinh.wisebot.documentservice.common.enums.EmbeddingStatus;
import vandinh.wisebot.documentservice.config.StorageProperties;
import vandinh.wisebot.documentservice.dto.request.EmbeddingRequest;
import vandinh.wisebot.documentservice.dto.response.DocumentChunkResponse;
import vandinh.wisebot.documentservice.dto.response.DocumentResponse;
import vandinh.wisebot.documentservice.dto.response.DocumentUploadResponse;
import vandinh.wisebot.documentservice.dto.response.EmbeddingResponse;
import vandinh.wisebot.documentservice.entity.Document;
import vandinh.wisebot.documentservice.entity.DocumentChunk;
import vandinh.wisebot.documentservice.entity.KnowledgeBase;
import vandinh.wisebot.documentservice.exception.InvalidDataException;
import vandinh.wisebot.documentservice.exception.ResourceNotFoundException;
import vandinh.wisebot.documentservice.repository.DocumentChunkRepository;
import vandinh.wisebot.documentservice.repository.DocumentRepository;
import vandinh.wisebot.documentservice.repository.KnowledgeBaseRepository;
import vandinh.wisebot.documentservice.service.DocumentService;
import vandinh.wisebot.documentservice.service.embedding.EmbeddingClient;
import vandinh.wisebot.documentservice.service.storage.StorageService;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DocumentServiceImpl implements DocumentService {

    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final KnowledgeBaseRepository knowledgeBaseRepository;
    private final StorageProperties storageProperties;
    private final StorageService storageService;
    private final AsyncDocumentProcessor asyncDocumentProcessor;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public DocumentUploadResponse upload(UUID knowledgeBaseId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidDataException("Vui lòng chọn tệp để tải lên");
        }

        KnowledgeBase knowledgeBase = knowledgeBaseRepository.findById(knowledgeBaseId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kho tri thức: " + knowledgeBaseId));
        if (knowledgeBase.getTenantId() == null) {
            throw new InvalidDataException("Kho tri thức chưa có tenantId");
        }

        byte[] fileBytes;
        try {
            fileBytes = file.getBytes();
        } catch (IOException e) {
            throw new InvalidDataException("Không thể đọc tệp");
        }

        String storagePath = storageService.store(knowledgeBaseId, file);

        Document document = Document.builder()
                .knowledgeBase(knowledgeBase)
                .filename(file.getOriginalFilename() == null ? "file" : file.getOriginalFilename())
                .contentType(file.getContentType())
                .size(file.getSize())
                .storagePath(storagePath)
                .status(DocumentStatus.UPLOADED)
                .build();

        Document saved = documentRepository.save(document);

        runAfterCommit(() ->
                asyncDocumentProcessor.processDocumentAsync(saved.getId(), knowledgeBase.getTenantId(), knowledgeBaseId, fileBytes)
        );

        return DocumentUploadResponse.builder()
                .document(toResponse(saved))
                .chunkCount(0)
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public List<DocumentUploadResponse> uploadBulk(UUID knowledgeBaseId, List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            throw new InvalidDataException("Vui lòng chọn ít nhất một tệp");
        }
        List<DocumentUploadResponse> responses = new ArrayList<>(files.size());
        for (MultipartFile file : files) {
            responses.add(upload(knowledgeBaseId, file));
        }
        return responses;
    }

    @Override
    @Transactional(readOnly = true)
    public DocumentResponse getMetadata(UUID id) {
        return toResponse(getDocument(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<DocumentResponse> listByKnowledgeBase(UUID knowledgeBaseId) {
        return documentRepository.findAllByKnowledgeBase_Id(knowledgeBaseId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(UUID id) {
        Document document = getDocument(id);
        documentChunkRepository.deleteAllByDocument_Id(id);
        documentRepository.delete(document);
    }

    @Override
    public boolean isStorageEnabled() {
        return storageProperties.isEnabled();
    }

    @Override
    @Transactional(readOnly = true)
    public Document getDocument(UUID id) {
        return documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public DocumentStatus getStatus(UUID id) {
        return getDocument(id).getStatus();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public DocumentResponse reprocess(UUID id) {
        Document document = getDocument(id);
        KnowledgeBase knowledgeBase = document.getKnowledgeBase();
        UUID knowledgeBaseId = knowledgeBase != null ? knowledgeBase.getId() : null;
        if (knowledgeBaseId == null) {
            throw new InvalidDataException("Tài liệu chưa gắn với kho tri thức");
        }
        UUID tenantId = knowledgeBase.getTenantId();
        if (tenantId == null) {
            throw new InvalidDataException("Kho tri thức chưa có tenantId");
        }

        List<DocumentChunk> chunks = documentChunkRepository.findAllByDocument_Id(id);
        if (chunks.isEmpty()) {
            throw new InvalidDataException("Không có đoạn dữ liệu để đồng bộ lại");
        }

        document.setStatus(DocumentStatus.PROCESSING);
        documentRepository.save(document);

        runAfterCommit(() ->
                asyncDocumentProcessor.reprocessDocumentAsync(id, tenantId, knowledgeBaseId, chunks)
        );
        
        return toResponse(document);
    }

    @Override
    @Transactional(readOnly = true)
    public String getPreview(UUID id) {
        List<DocumentChunk> chunks = documentChunkRepository.findAllByDocument_Id(id);
        if (chunks.isEmpty()) {
            return "";
        }

        StringBuilder builder = new StringBuilder();
        int max = Math.min(chunks.size(), 3);
        for (int i = 0; i < max; i++) {
            if (i > 0) {
                builder.append("\n\n");
            }
            builder.append(chunks.get(i).getContent());
        }
        return builder.toString();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DocumentChunkResponse> getChunks(UUID id) {
        return documentChunkRepository.findAllByDocument_Id(id)
                .stream()
                .map(this::toChunkResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DocumentChunkResponse> search(UUID knowledgeBaseId, String query) {
        if (query == null || query.isBlank()) {
            return List.of();
        }
        return documentChunkRepository.searchInKnowledgeBase(knowledgeBaseId, query)
                .stream()
                .map(this::toChunkResponse)
                .toList();
    }

    private DocumentResponse toResponse(Document document) {
        return DocumentResponse.builder()
                .id(document.getId())
                .knowledgeBaseId(document.getKnowledgeBase() != null ? document.getKnowledgeBase().getId() : null)
                .filename(document.getFilename())
                .contentType(document.getContentType())
                .size(document.getSize())
                .storagePath(document.getStoragePath())
                .status(document.getStatus())
                .createdAt(document.getCreatedAt())
                .build();
    }

    private DocumentChunkResponse toChunkResponse(DocumentChunk chunk) {
        return DocumentChunkResponse.builder()
                .id(chunk.getId())
                .documentId(chunk.getDocument() != null ? chunk.getDocument().getId() : null)
                .chunkIndex(chunk.getChunkIndex())
                .content(chunk.getContent())
                .embeddingId(chunk.getEmbeddingId())
                .status(chunk.getStatus() != null ? chunk.getStatus().name() : null)
                .build();
    }

    private void runAfterCommit(Runnable action) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            action.run();
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                action.run();
            }
        });
    }
}
