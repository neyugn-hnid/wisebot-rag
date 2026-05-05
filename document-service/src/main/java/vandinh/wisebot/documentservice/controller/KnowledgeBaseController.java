package vandinh.wisebot.documentservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vandinh.wisebot.documentservice.common.response.ApiResponse;
import vandinh.wisebot.documentservice.dto.request.KnowledgeBaseRequest;
import vandinh.wisebot.documentservice.service.KnowledgeBaseService;

import java.util.UUID;

@RestController
@RequestMapping("/knowledge-bases")
@RequiredArgsConstructor
public class KnowledgeBaseController {

    private final KnowledgeBaseService knowledgeBaseService;

    private UUID getCurrentTenantId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getDetails() == null) {
            throw new IllegalStateException("Missing authentication context");
        }
        if (!(authentication.getDetails() instanceof java.util.Map<?, ?> details)) {
            throw new IllegalStateException("Missing tenant context");
        }
        Object tenantId = details.get("tenantId");
        if (!(tenantId instanceof String tenantIdStr) || tenantIdStr.isBlank()) {
            throw new IllegalStateException("Missing tenantId in authentication context");
        }
        return UUID.fromString(tenantIdStr);
    }

    @PostMapping
    public ApiResponse create(@RequestBody @Valid KnowledgeBaseRequest request) {
        return ApiResponse.builder()
                .status(HttpStatus.CREATED.value())
                .message("Tạo kho tri thức thành công")
                .data(knowledgeBaseService.create(request, getCurrentTenantId()))
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse getById(@PathVariable UUID id) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Thông tin kho tri thức")
                .data(knowledgeBaseService.getById(id, getCurrentTenantId()))
                .build();
    }

    @GetMapping
    public ApiResponse listAll() {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Danh sách kho tri thức")
                .data(knowledgeBaseService.listAll(getCurrentTenantId()))
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse update(@PathVariable UUID id, @RequestBody @Valid KnowledgeBaseRequest request) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Cập nhật kho tri thức thành công")
                .data(knowledgeBaseService.update(id, request, getCurrentTenantId()))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse delete(@PathVariable UUID id) {
        knowledgeBaseService.delete(id, getCurrentTenantId());
        return ApiResponse.builder()
                .status(HttpStatus.NO_CONTENT.value())
                .message("Xóa kho tri thức thành công")
                .build();
    }
}
