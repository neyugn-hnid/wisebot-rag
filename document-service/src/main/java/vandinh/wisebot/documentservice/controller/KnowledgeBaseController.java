package vandinh.wisebot.documentservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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

    @PostMapping
    public ApiResponse create(@RequestBody @Valid KnowledgeBaseRequest request) {
        return ApiResponse.builder()
                .status(HttpStatus.CREATED.value())
                .message("Knowledge base created")
                .data(knowledgeBaseService.create(request))
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse getById(@PathVariable UUID id) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Knowledge base")
                .data(knowledgeBaseService.getById(id))
                .build();
    }

    @GetMapping
    public ApiResponse listAll() {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Knowledge bases")
                .data(knowledgeBaseService.listAll())
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse update(@PathVariable UUID id, @RequestBody @Valid KnowledgeBaseRequest request) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Knowledge base updated")
                .data(knowledgeBaseService.update(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse delete(@PathVariable UUID id) {
        knowledgeBaseService.delete(id);
        return ApiResponse.builder()
                .status(HttpStatus.NO_CONTENT.value())
                .message("Knowledge base deleted")
                .build();
    }
}
