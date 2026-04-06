package vandinh.wisebot.documentservice.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import vandinh.wisebot.documentservice.config.StorageProperties;
import vandinh.wisebot.documentservice.dto.response.DocumentResponse;
import vandinh.wisebot.documentservice.entity.Document;
import vandinh.wisebot.documentservice.exception.InvalidDataException;
import vandinh.wisebot.documentservice.exception.ResourceNotFoundException;
import vandinh.wisebot.documentservice.repository.DocumentRepository;
import vandinh.wisebot.documentservice.service.DocumentService;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DocumentServiceImpl implements DocumentService {

    private final DocumentRepository documentRepository;
    private final StorageProperties storageProperties;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public DocumentResponse upload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidDataException("File is required");
        }

        Document document = Document.builder()
                .filename(file.getOriginalFilename() == null ? "file" : file.getOriginalFilename())
                .contentType(file.getContentType())
                .size(file.getSize())
                .storageKey(storageProperties.isEnabled() ? generateStorageKey(file) : null)
                .build();

        Document saved = documentRepository.save(document);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public DocumentResponse getMetadata(UUID id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + id));
        return toResponse(document);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(UUID id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + id));
        documentRepository.delete(document);
    }

    @Override
    public boolean isStorageEnabled() {
        return storageProperties.isEnabled();
    }

    private String generateStorageKey(MultipartFile file) {
        return UUID.randomUUID() + "_" + (file.getOriginalFilename() == null ? "file" : file.getOriginalFilename());
    }

    private DocumentResponse toResponse(Document document) {
        return DocumentResponse.builder()
                .id(document.getId())
                .filename(document.getFilename())
                .contentType(document.getContentType())
                .size(document.getSize())
                .storageKey(document.getStorageKey())
                .createdAt(document.getCreatedAt())
                .build();
    }
}
