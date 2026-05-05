package vandinh.wisebot.documentservice.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import vandinh.wisebot.documentservice.common.enums.DocumentStatus;
import vandinh.wisebot.documentservice.common.enums.EmbeddingStatus;
import vandinh.wisebot.documentservice.dto.request.EmbeddingRequest;
import vandinh.wisebot.documentservice.dto.response.EmbeddingResponse;
import vandinh.wisebot.documentservice.entity.Document;
import vandinh.wisebot.documentservice.entity.DocumentChunk;
import vandinh.wisebot.documentservice.repository.DocumentChunkRepository;
import vandinh.wisebot.documentservice.repository.DocumentRepository;
import vandinh.wisebot.documentservice.service.embedding.EmbeddingClient;
import vandinh.wisebot.documentservice.service.text.TextChunker;
import vandinh.wisebot.documentservice.service.text.TextExtractor;

import java.io.ByteArrayInputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AsyncDocumentProcessor {

    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final TextExtractor textExtractor;
    private final TextChunker textChunker;
    private final EmbeddingClient embeddingClient;

    @Async
    public void processDocumentAsync(UUID documentId, UUID tenantId, UUID knowledgeBaseId, byte[] fileContent) {
        
        Document document = documentRepository.findById(documentId).orElse(null);
        if (document == null) {
            log.error("Tài liệu không tồn tại: {}", documentId);
            return;
        }

        try {
            document.setStatus(DocumentStatus.PROCESSING);
            documentRepository.save(document);

            String text = textExtractor.extract(new ByteArrayInputStream(fileContent));
            List<String> chunks = textChunker.chunk(text);
            
            if (chunks.isEmpty()) {
                log.warn("Không có văn bản nào được trích xuất cho tài liệu: {}", documentId);
                document.setStatus(DocumentStatus.FAILED);
                documentRepository.save(document);
                return;
            }

            List<DocumentChunk> chunkEntities = new ArrayList<>(chunks.size());
            for (int i = 0; i < chunks.size(); i++) {
                chunkEntities.add(DocumentChunk.builder()
                        .document(document)
                        .chunkIndex(i)
                        .content(chunks.get(i))
                        .status(EmbeddingStatus.PENDING)
                        .build());
            }
            documentChunkRepository.saveAll(chunkEntities);

            boolean embedded = embedChunks(documentId, tenantId, knowledgeBaseId, chunkEntities);
            document.setStatus(embedded ? DocumentStatus.PROCESSED : DocumentStatus.FAILED);
            documentRepository.save(document);
            log.info("Tài liệu {}: Status: {}", documentId, document.getStatus());
            
        } catch (Exception e) {
            log.error("Lỗi khi xử lý tài liệu: {}", documentId, e);
            document.setStatus(DocumentStatus.FAILED);
            documentRepository.save(document);
        }
    }

    @Async
    public void reprocessDocumentAsync(UUID documentId, UUID tenantId, UUID knowledgeBaseId, List<DocumentChunk> chunks) {
        log.info("Bắt đầu xử lý lại tài liệu: {}", documentId);
        Document document = documentRepository.findById(documentId).orElse(null);
        if (document == null) {
            log.error("Tài liệu không tồn tại: {}", documentId);
            return;
        }

        try {
            boolean embedded = embedChunks(documentId, tenantId, knowledgeBaseId, chunks);
            document.setStatus(embedded ? DocumentStatus.PROCESSED : DocumentStatus.FAILED);
            documentRepository.save(document);
            log.info("Hoàn thành xử lý lại tài liệu: {}. Status: {}", documentId, document.getStatus());
        } catch (Exception e) {
            log.error("Lỗi khi xử lý lại tài liệu: {}", documentId, e);
            document.setStatus(DocumentStatus.FAILED);
            documentRepository.save(document);
        }
    }

    private boolean embedChunks(UUID documentId, UUID tenantId, UUID knowledgeBaseId, List<DocumentChunk> chunks) {
        try {
            List<EmbeddingRequest.EmbeddingChunk> requestChunks = chunks.stream()
                    .map(c -> EmbeddingRequest.EmbeddingChunk.builder()
                            .index(c.getChunkIndex())
                            .content(c.getContent())
                            .build())
                    .toList();

            EmbeddingRequest request = EmbeddingRequest.builder()
                    .tenantId(tenantId)
                    .knowledgeBaseId(knowledgeBaseId)
                    .documentId(documentId)
                    .chunks(requestChunks)
                    .build();

            EmbeddingResponse response = embeddingClient.embed(request);
            Map<Integer, String> embeddingMap = new HashMap<>();
            if (response != null && response.getResults() != null) {
                for (EmbeddingResponse.EmbeddingResult result : response.getResults()) {
                    embeddingMap.put(result.getIndex(), result.getEmbeddingId());
                }
            }

            for (DocumentChunk chunk : chunks) {
                String embeddingId = embeddingMap.get(chunk.getChunkIndex());
                if (embeddingId != null && !embeddingId.isBlank()) {
                    chunk.setEmbeddingId(embeddingId);
                    chunk.setStatus(EmbeddingStatus.EMBEDDED);
                } else {
                    chunk.setStatus(EmbeddingStatus.FAILED);
                }
            }
            documentChunkRepository.saveAll(chunks);

            return chunks.stream().anyMatch(c -> c.getStatus() == EmbeddingStatus.EMBEDDED);
        } catch (Exception ex) {
            log.error("Lỗi khi nhúng chunks cho tài liệu: {}", documentId, ex);
            for (DocumentChunk chunk : chunks) {
                chunk.setStatus(EmbeddingStatus.FAILED);
            }
            documentChunkRepository.saveAll(chunks);
            return false;
        }
    }
}
