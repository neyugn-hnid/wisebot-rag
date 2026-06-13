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
import vandinh.wisebot.documentservice.service.kreuzberg.KreuzbergClient;

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
    private final KreuzbergClient kreuzbergClient;
    private final EmbeddingClient embeddingClient;

    @Async
    public void processDocumentAsync(UUID documentId, UUID tenantId, UUID knowledgeBaseId, byte[] fileContent) {
        log.info("Starting async processing for document: {}", documentId);
        
        Document document = documentRepository.findById(documentId).orElse(null);
        if (document == null) {
            log.error("Document not found: {}", documentId);
            return;
        }

        try {
            document.setStatus(DocumentStatus.PROCESSING);
            documentRepository.save(document);

            // Call kreuzberg-service (Python, full features: ChunkConfig, OCR, tables)
            KreuzbergClient.KreuzbergResult result = kreuzbergClient.parse(
                    fileContent, document.getFilename(), document.getContentType());

            if (result == null || !result.hasContent()) {
                log.warn("Kreuzberg returned empty for: {}", documentId);
                document.setStatus(DocumentStatus.FAILED);
                documentRepository.save(document);
                return;
            }

            // Use chunks from kreuzberg-service (markdown-aware, heading-preserving)
            List<KreuzbergClient.KreuzbergChunk> kChunks = result.getChunks();
            if (kChunks == null || kChunks.isEmpty()) {
                // Fallback: treat full text as single chunk
                kChunks = List.of(KreuzbergClient.KreuzbergChunk.builder()
                        .content(result.getText()).build());
            }

            List<DocumentChunk> chunkEntities = new ArrayList<>();
            int idx = 0;
            for (KreuzbergClient.KreuzbergChunk kc : kChunks) {
                if (kc.getContent() != null && !kc.getContent().isBlank()) {
                    chunkEntities.add(DocumentChunk.builder()
                            .document(document)
                            .chunkIndex(idx++)
                            .content(kc.getContent())
                            .status(EmbeddingStatus.PENDING)
                            .build());
                }
            }
            if (chunkEntities.isEmpty()) {
                log.warn("No chunks for document: {}", documentId);
                document.setStatus(DocumentStatus.FAILED);
                documentRepository.save(document);
                return;
            }
            documentChunkRepository.saveAll(chunkEntities);

            boolean embedded = embedChunks(documentId, tenantId, knowledgeBaseId, chunkEntities);
            document.setStatus(embedded ? DocumentStatus.PROCESSED : DocumentStatus.FAILED);
            documentRepository.save(document);
            log.info("Finished async processing for document: {}. Status: {}", documentId, document.getStatus());
            
        } catch (Exception e) {
            log.error("Error processing document: {}", documentId, e);
            document.setStatus(DocumentStatus.FAILED);
            documentRepository.save(document);
        }
    }

    @Async
    public void reprocessDocumentAsync(UUID documentId, UUID tenantId, UUID knowledgeBaseId, List<DocumentChunk> chunks) {
        log.info("Starting async reprocessing for document: {}", documentId);
        Document document = documentRepository.findById(documentId).orElse(null);
        if (document == null) {
            log.error("Document not found: {}", documentId);
            return;
        }

        try {
            boolean embedded = embedChunks(documentId, tenantId, knowledgeBaseId, chunks);
            document.setStatus(embedded ? DocumentStatus.PROCESSED : DocumentStatus.FAILED);
            documentRepository.save(document);
            log.info("Finished async reprocessing for document: {}. Status: {}", documentId, document.getStatus());
        } catch (Exception e) {
            log.error("Error reprocessing document: {}", documentId, e);
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
            log.error("Failed to embed chunks for document: {}", documentId, ex);
            for (DocumentChunk chunk : chunks) {
                chunk.setStatus(EmbeddingStatus.FAILED);
            }
            documentChunkRepository.saveAll(chunks);
            return false;
        }
    }
}
