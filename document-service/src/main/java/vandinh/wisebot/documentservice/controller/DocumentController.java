package vandinh.wisebot.documentservice.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import vandinh.wisebot.documentservice.common.response.ApiResponse;
import vandinh.wisebot.documentservice.dto.response.DocumentResponse;
import vandinh.wisebot.documentservice.service.DocumentService;

import java.util.UUID;

@RestController
@RequestMapping("/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping("/upload")
    public ApiResponse upload(@RequestParam("file") MultipartFile file) {
        DocumentResponse response = documentService.upload(file);
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Uploaded successfully")
                .data(response)
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse getMetadata(@PathVariable UUID id) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Document metadata")
                .data(documentService.getMetadata(id))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse delete(@PathVariable UUID id) {
        documentService.delete(id);
        return ApiResponse.builder()
                .status(HttpStatus.NO_CONTENT.value())
                .message("Deleted successfully")
                .build();
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<ApiResponse> download(@PathVariable UUID id) {
        DocumentResponse metadata = documentService.getMetadata(id);
        if (!documentService.isStorageEnabled()) {
            ApiResponse response = ApiResponse.builder()
                    .status(HttpStatus.NOT_IMPLEMENTED.value())
                    .message("Storage is disabled. Only metadata is stored.")
                    .data(metadata)
                    .build();
            return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body(response);
        }

        ApiResponse response = ApiResponse.builder()
                .status(HttpStatus.NOT_IMPLEMENTED.value())
                .message("Storage enabled but file download is not implemented yet.")
                .data(metadata)
                .build();
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body(response);
    }
}
