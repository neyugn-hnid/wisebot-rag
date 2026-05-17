package vandinh.wisebot.chatservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vandinh.wisebot.chatservice.common.response.ApiResponse;
import vandinh.wisebot.chatservice.dto.request.AskRequest;
import vandinh.wisebot.chatservice.dto.request.CreateSessionRequest;
import vandinh.wisebot.chatservice.dto.request.MessageFeedbackRequest;
import vandinh.wisebot.chatservice.dto.request.SendMessageRequest;
import vandinh.wisebot.chatservice.service.ChatService;

import java.util.UUID;
import java.util.Map;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/sessions")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','USER','AGENT')")
    public ApiResponse createSession(@Valid @RequestBody CreateSessionRequest request) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Session created")
                .data(chatService.createSession(request))
                .build();
    }

    @GetMapping("/sessions")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','USER','AGENT')")
    public ApiResponse listSessions(@RequestParam UUID tenantId) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Sessions")
                .data(chatService.listSessions(tenantId))
                .build();
    }

    @PostMapping("/sessions/{sessionId}/messages")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','USER','AGENT')")
    public ApiResponse sendMessage(@PathVariable UUID sessionId, @Valid @RequestBody SendMessageRequest request) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Message sent")
                .data(chatService.sendMessage(sessionId, request))
                .build();
    }

    @PostMapping("/sessions/{sessionId}/ask")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','USER','AGENT')")
    public ApiResponse ask(@PathVariable UUID sessionId, @Valid @RequestBody AskRequest request) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Answered")
                .data(chatService.ask(sessionId, request))
                .build();
    }

    @GetMapping("/sessions/{sessionId}/messages")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','USER','AGENT')")
    public ApiResponse listMessages(@PathVariable UUID sessionId) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Messages")
                .data(chatService.listMessages(sessionId))
                .build();
    }

    @GetMapping("/messages/{messageId}/citations")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','USER','AGENT')")
    public ApiResponse listCitations(@PathVariable UUID messageId) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Citations")
                .data(chatService.listCitations(messageId))
                .build();
    }

    @PostMapping("/messages/{messageId}/feedback")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','USER')")
    public ApiResponse submitFeedback(@PathVariable UUID messageId, @Valid @RequestBody MessageFeedbackRequest request) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Feedback submitted")
                .data(chatService.submitFeedback(messageId, request))
                .build();
    }

    @GetMapping("/messages/{messageId}/feedback")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','AGENT')")
    public ApiResponse listFeedback(@PathVariable UUID messageId) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Feedback")
                .data(chatService.listFeedback(messageId))
                .build();
    }

    @DeleteMapping("/sessions/{sessionId}")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','AGENT')")
    public ApiResponse closeSession(@PathVariable UUID sessionId) {
        chatService.closeSession(sessionId);
        return ApiResponse.builder()
                .status(HttpStatus.NO_CONTENT.value())
                .message("Session closed")
                .build();
    }

    @GetMapping("/provider")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','USER','AGENT')")
    public ApiResponse providerInfo() {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Provider info")
                .data(chatService.getProviderInfo())
                .build();
    }

    @PostMapping("/provider/mode")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ApiResponse updateProviderMode(@RequestBody Map<String, String> request) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Provider mode updated")
                .data(chatService.updateProviderMode(request.getOrDefault("mode", "")))
                .build();
    }

    @GetMapping("/embedding-provider")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','USER','AGENT')")
    public ApiResponse embeddingProviderInfo() {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Embedding provider info")
                .data(chatService.getEmbeddingProviderInfo())
                .build();
    }

    @PostMapping("/embedding-provider/mode")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ApiResponse updateEmbeddingProviderMode(@RequestBody Map<String, String> request) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Embedding provider mode updated")
                .data(chatService.updateEmbeddingProviderMode(request.getOrDefault("mode", "")))
                .build();
    }
}
