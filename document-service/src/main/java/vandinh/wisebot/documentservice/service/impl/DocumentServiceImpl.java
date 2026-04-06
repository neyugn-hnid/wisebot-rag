package vandinh.wisebot.documentservice.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
import vandinh.wisebot.documentservice.service.text.TextChunker;
import vandinh.wisebot.documentservice.service.text.TextExtractor;

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
    private final TextExtractor textExtractor;
    private final TextChunker textChunker;
    private final EmbeddingClient embeddingClient;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public DocumentUploadResponse upload(UUID knowledgeBaseId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidDataException("File is required");
        }

        KnowledgeBase knowledgeBase = knowledgeBaseRepository.findById(knowledgeBaseId)
                .orElseThrow(() -> new ResourceNotFoundException("Knowledge base not found: " + knowledgeBaseId));

        String storagePath = storageService.store(knowledgeBaseId, file);
        String text = textExtractor.extract(file);
        List<String> chunks = textChunker.chunk(text);
        if (chunks.isEmpty()) {
            throw new InvalidDataException("Extracted text is empty");
        }

        Document document = Document.builder()
                .knowledgeBase(knowledgeBase)
                .filename(file.getOriginalFilename() == null ? "file" : file.getOriginalFilename())
                .contentType(file.getContentType())
                .size(file.getSize())
                .storagePath(storagePath)
                .status(DocumentStatus.UPLOADED)
                .build();

        Document saved = documentRepository.save(document);

        List<DocumentChunk> chunkEntities = new ArrayList<>(chunks.size());
        for (int i = 0; i < chunks.size(); i++) {
            chunkEntities.add(DocumentChunk.builder()
                    .document(saved)
                    .chunkIndex(i)
                    .content(chunks.get(i))
                    .status(EmbeddingStatus.PENDING)
                    .build());
        }
        documentChunkRepository.saveAll(chunkEntities);

        boolean embedded = embedChunks(saved.getId(), knowledgeBaseId, chunkEntities);
        saved.setStatus(embedded ? DocumentStatus.PROCESSED : DocumentStatus.FAILED);
        documentRepository.save(saved);

        return DocumentUploadResponse.builder()
                .document(toResponse(saved))
                .chunkCount(chunkEntities.size())
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public List<DocumentUploadResponse> uploadBulk(UUID knowledgeBaseId, List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            throw new InvalidDataException("Files are required");
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
                .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + id));
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
        UUID knowledgeBaseId = document.getKnowledgeBase() != null ? document.getKnowledgeBase().getId() : null;
        if (knowledgeBaseId == null) {
            throw new InvalidDataException("Knowledge base is missing for document");
        }

        List<DocumentChunk> chunks = documentChunkRepository.findAllByDocument_Id(id);
        if (chunks.isEmpty()) {
            throw new InvalidDataException("No chunks to reprocess");
        }

        boolean embedded = embedChunks(id, knowledgeBaseId, chunks);
        document.setStatus(embedded ? DocumentStatus.PROCESSED : DocumentStatus.FAILED);
        documentRepository.save(document);
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

    private boolean embedChunks(UUID documentId, UUID knowledgeBaseId, List<DocumentChunk> chunks) {
        try {
            List<EmbeddingRequest.EmbeddingChunk> requestChunks = chunks.stream()
                    .map(c -> EmbeddingRequest.EmbeddingChunk.builder()
                            .index(c.getChunkIndex())
                            .content(c.getContent())
                            .build())
                    .toList();

            EmbeddingRequest request = EmbeddingRequest.builder()
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
            for (DocumentChunk chunk : chunks) {
                chunk.setStatus(EmbeddingStatus.FAILED);
            }
            documentChunkRepository.saveAll(chunks);
            return false;
        }
    }
}
