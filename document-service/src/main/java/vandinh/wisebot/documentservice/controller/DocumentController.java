package vandinh.wisebot.documentservice.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import vandinh.wisebot.documentservice.common.response.ApiResponse;
import vandinh.wisebot.documentservice.dto.response.DocumentChunkResponse;
import vandinh.wisebot.documentservice.dto.response.DocumentUploadResponse;
import vandinh.wisebot.documentservice.entity.Document;
import vandinh.wisebot.documentservice.dto.response.DocumentResponse;
import vandinh.wisebot.documentservice.service.DocumentService;
import vandinh.wisebot.documentservice.service.storage.StorageService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;
    private final StorageService storageService;

    @PostMapping("/knowledge-bases/{knowledgeBaseId}/documents")
    public ApiResponse upload(@PathVariable UUID knowledgeBaseId, @RequestParam("file") MultipartFile file) {
        DocumentUploadResponse response = documentService.upload(knowledgeBaseId, file);
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Tải tệp lên thành công")
                .data(response)
                .build();
    }

    @PostMapping("/knowledge-bases/{knowledgeBaseId}/documents/bulk")
    public ApiResponse uploadBulk(@PathVariable UUID knowledgeBaseId, @RequestParam("files") List<MultipartFile> files) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Tải nhiều tệp lên thành công")
                .data(documentService.uploadBulk(knowledgeBaseId, files))
                .build();
    }

    @GetMapping("/knowledge-bases/{knowledgeBaseId}/documents")
    public ApiResponse listByKnowledgeBase(@PathVariable UUID knowledgeBaseId) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Danh sách tài liệu")
                .data(documentService.listByKnowledgeBase(knowledgeBaseId))
                .build();
    }

    @GetMapping("/documents/{id}")
    public ApiResponse getMetadata(@PathVariable UUID id) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Thông tin tài liệu")
                .data(documentService.getMetadata(id))
                .build();
    }

    @GetMapping("/documents/{id}/status")
    public ApiResponse getStatus(@PathVariable UUID id) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Trạng thái tài liệu")
                .data(documentService.getStatus(id))
                .build();
    }

    @PostMapping("/documents/{id}/reprocess")
    public ApiResponse reprocess(@PathVariable UUID id) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Đồng bộ lại tài liệu thành công")
                .data(documentService.reprocess(id))
                .build();
    }

    @DeleteMapping("/documents/{id}")
    public ApiResponse delete(@PathVariable UUID id) {
        documentService.delete(id);
        return ApiResponse.builder()
                .status(HttpStatus.NO_CONTENT.value())
                .message("Xóa tài liệu thành công")
                .build();
    }

    @GetMapping("/documents/{id}/preview")
    public ApiResponse preview(@PathVariable UUID id) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Nội dung xem trước tài liệu")
                .data(documentService.getPreview(id))
                .build();
    }

    @GetMapping("/documents/{id}/chunks")
    public ApiResponse getChunks(@PathVariable UUID id) {
        List<DocumentChunkResponse> chunks = documentService.getChunks(id);
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Danh sách đoạn tài liệu")
                .data(chunks)
                .build();
    }

    @GetMapping("/knowledge-bases/{knowledgeBaseId}/search")
    public ApiResponse search(@PathVariable UUID knowledgeBaseId, @RequestParam("q") String query) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Kết quả tìm kiếm")
                .data(documentService.search(knowledgeBaseId, query))
                .build();
    }

    @GetMapping("/documents/{id}/download")
    public ResponseEntity<?> download(@PathVariable UUID id) {
        Document document = documentService.getDocument(id);
        if (!documentService.isStorageEnabled()) {
            ApiResponse response = ApiResponse.builder()
                    .status(HttpStatus.NOT_IMPLEMENTED.value())
                    .message("Lưu trữ tệp đang tắt. Chỉ lưu metadata.")
                    .data(documentService.getMetadata(id))
                    .build();
            return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body(response);
        }

        Resource resource = storageService.loadAsResource(document.getStoragePath());
        String contentType = document.getContentType() != null ? document.getContentType() : MediaType.APPLICATION_OCTET_STREAM_VALUE;
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + document.getFilename() + "\"")
                .body(resource);
    }
}
