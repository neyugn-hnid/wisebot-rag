package vandinh.wisebot.chatservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vandinh.wisebot.chatservice.common.response.ApiResponse;
import vandinh.wisebot.chatservice.dto.request.AskRequest;
import vandinh.wisebot.chatservice.dto.request.CreateSessionRequest;
import vandinh.wisebot.chatservice.dto.request.PublicWidgetAskRequest;
import vandinh.wisebot.chatservice.dto.request.PublicWidgetSessionRequest;
import vandinh.wisebot.chatservice.service.ChatService;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/public")
@RequiredArgsConstructor
public class PublicChatController {

    private final ChatService chatService;

    @PostMapping("/widgets/{widgetId}/sessions")
    public ApiResponse createSession(@PathVariable UUID widgetId, @Valid @RequestBody PublicWidgetSessionRequest request) {
        CreateSessionRequest sessionRequest = new CreateSessionRequest();
        sessionRequest.setTenantId(request.getTenantId());
        sessionRequest.setWidgetId(widgetId);
        sessionRequest.setChannel("WIDGET");
        sessionRequest.setTitle(request.getTitle() == null || request.getTitle().isBlank() ? "Widget Chat" : request.getTitle());

        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Session created")
                .data(chatService.createSession(sessionRequest))
                .build();
    }

    @PostMapping("/sessions/{sessionId}/ask")
    public ApiResponse askPublic(@PathVariable UUID sessionId, @Valid @RequestBody PublicWidgetAskRequest request) {
        Authentication previous = SecurityContextHolder.getContext().getAuthentication();
        try {
            SecurityContextHolder.getContext().setAuthentication(buildWidgetAuthentication(request.getTenantId(), request.getWidgetId()));

            AskRequest askRequest = new AskRequest();
            askRequest.setQuestion(request.getQuestion());
            askRequest.setTopK(request.getTopK());
            askRequest.setTemperature(request.getTemperature());
            askRequest.setKnowledgeBaseId(request.getKnowledgeBaseId());

            return ApiResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("Answered")
                    .data(chatService.ask(sessionId, askRequest))
                    .build();
        } finally {
            SecurityContextHolder.getContext().setAuthentication(previous);
        }
    }

    private UsernamePasswordAuthenticationToken buildWidgetAuthentication(UUID tenantId, UUID widgetId) {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "widget:" + widgetId,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
        auth.setDetails(Map.of("tenantId", tenantId.toString()));
        return auth;
    }
}
