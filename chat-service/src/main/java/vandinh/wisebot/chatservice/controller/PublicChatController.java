package vandinh.wisebot.chatservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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
    public ApiResponse createSession(@PathVariable UUID widgetId, @Valid @RequestBody CreateSessionRequest request) {
        request.setWidgetId(widgetId);
        if (request.getChannel() == null || request.getChannel().isBlank()) {
            request.setChannel("WIDGET");
        }

        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Session created")
                .data(chatService.createSession(request))
                .build();
    }

    @PostMapping("/widgets/{widgetId}/sessions/{sessionId}/ask")
    public ApiResponse ask(
            @PathVariable UUID widgetId,
            @PathVariable UUID sessionId,
            @Valid @RequestBody AskRequest request,
            @RequestBody CreateSessionRequest ignored) {
        throw new UnsupportedOperationException();
    }

    @PostMapping("/sessions/{sessionId}/ask")
    public ApiResponse askPublic(@PathVariable UUID sessionId, @Valid @RequestBody AskRequest request) {
        throw new UnsupportedOperationException();
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
