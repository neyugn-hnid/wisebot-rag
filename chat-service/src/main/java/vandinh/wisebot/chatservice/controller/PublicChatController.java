package vandinh.wisebot.chatservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vandinh.wisebot.chatservice.common.response.ApiResponse;
import vandinh.wisebot.chatservice.config.WidgetProperties;
import vandinh.wisebot.chatservice.dto.request.AskRequest;
import vandinh.wisebot.chatservice.dto.request.CreateSessionRequest;
import vandinh.wisebot.chatservice.dto.request.PublicWidgetAskRequest;
import vandinh.wisebot.chatservice.dto.request.PublicWidgetSessionRequest;
import vandinh.wisebot.chatservice.service.ChatService;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/public")
@RequiredArgsConstructor
public class PublicChatController {

    private final ChatService chatService;
    private final RestTemplate restTemplate;
    private final WidgetProperties widgetProperties;

    @PostMapping("/widgets/{widgetId}/sessions")
    public ResponseEntity<ApiResponse> createSession(
            @PathVariable UUID widgetId,
            @RequestHeader(value = "Origin", required = false) String origin,
            @RequestHeader(value = "Referer", required = false) String referer,
            @Valid @RequestBody PublicWidgetSessionRequest request
    ) {
        if (!isWidgetOriginAllowed(widgetId, origin, referer, null)) {
            return forbiddenDomain();
        }

        CreateSessionRequest sessionRequest = new CreateSessionRequest();
        sessionRequest.setTenantId(request.getTenantId());
        sessionRequest.setWidgetId(widgetId);
        sessionRequest.setChannel("WIDGET");
        sessionRequest.setTitle(request.getTitle() == null || request.getTitle().isBlank() ? "Widget Chat" : request.getTitle());

        return ResponseEntity.ok(ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Session created")
                .data(chatService.createSession(sessionRequest))
                .build());
    }

    @PostMapping("/sessions/{sessionId}/ask")
    public ResponseEntity<ApiResponse> askPublic(
            @PathVariable UUID sessionId,
            @RequestHeader(value = "Origin", required = false) String origin,
            @RequestHeader(value = "Referer", required = false) String referer,
            @Valid @RequestBody PublicWidgetAskRequest request
    ) {
        if (!isWidgetOriginAllowed(request.getWidgetId(), origin, referer, extractSourceUrl(request.getPageContext()))) {
            return forbiddenDomain();
        }

        Authentication previous = SecurityContextHolder.getContext().getAuthentication();
        try {
            SecurityContextHolder.getContext().setAuthentication(buildWidgetAuthentication(request.getTenantId(), request.getWidgetId()));

            AskRequest askRequest = new AskRequest();
            askRequest.setQuestion(request.getQuestion());
            askRequest.setTopK(request.getTopK());
            askRequest.setTemperature(request.getTemperature());
            askRequest.setKnowledgeBaseId(request.getKnowledgeBaseId());
            askRequest.setPageContext(request.getPageContext());

            return ResponseEntity.ok(ApiResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("Answered")
                    .data(chatService.ask(sessionId, askRequest))
                    .build());
        } finally {
            SecurityContextHolder.getContext().setAuthentication(previous);
        }
    }

    @SuppressWarnings("unchecked")
    private boolean isWidgetOriginAllowed(UUID widgetId, String origin, String referer, String sourceUrl) {
        if (widgetId == null) {
            return false;
        }

        try {
            var headers = new org.springframework.http.HttpHeaders();
            if (origin != null && !origin.isBlank()) {
                headers.set("Origin", origin);
            }
            if (referer != null && !referer.isBlank()) {
                headers.set("Referer", referer);
            }

            var entity = new org.springframework.http.HttpEntity<>(
                    Map.of("sourceUrl", sourceUrl == null ? "" : sourceUrl),
                    headers
            );
            var response = restTemplate.postForEntity(
                    widgetProperties.getBaseUrl() + "/public/widgets/" + widgetId + "/origin/validate",
                    entity,
                    Map.class
            );
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                return false;
            }

            Map<String, Object> data = (Map<String, Object>) response.getBody().get("data");
            return data != null && Boolean.TRUE.equals(data.get("allowed"));
        } catch (Exception ignored) {
            return false;
        }
    }

    private String extractSourceUrl(Map<String, Object> pageContext) {
        if (pageContext == null || pageContext.get("pageUrl") == null) {
            return null;
        }
        return pageContext.get("pageUrl").toString();
    }

    private ResponseEntity<ApiResponse> forbiddenDomain() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.builder()
                .status(HttpStatus.FORBIDDEN.value())
                .message("Domain not allowed for this widget")
                .build());
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
