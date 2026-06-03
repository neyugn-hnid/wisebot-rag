package vandinh.wisebot.widgetservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vandinh.wisebot.widgetservice.common.response.ApiResponse;
import vandinh.wisebot.widgetservice.dto.request.AddDomainRequest;
import vandinh.wisebot.widgetservice.dto.request.CreateApiKeyRequest;
import vandinh.wisebot.widgetservice.dto.request.CreateWidgetSessionRequest;
import vandinh.wisebot.widgetservice.dto.request.CreateWidgetRequest;
import vandinh.wisebot.widgetservice.dto.request.TrackEventRequest;
import vandinh.wisebot.widgetservice.dto.request.UpdateWidgetRequest;
import vandinh.wisebot.widgetservice.service.WidgetService;

import java.util.UUID;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class WidgetController {

    private final WidgetService widgetService;

    @PostMapping("/widgets")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','USER')")
    public ApiResponse createWidget(@Valid @RequestBody CreateWidgetRequest request) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Widget created")
                .data(widgetService.createWidget(request))
                .build();
    }

    @PutMapping("/widgets/{widgetId}")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','USER')")
    public ApiResponse updateWidget(@PathVariable UUID widgetId, @Valid @RequestBody UpdateWidgetRequest request) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Widget updated")
                .data(widgetService.updateWidget(widgetId, request))
                .build();
    }

    @GetMapping("/widgets")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','USER','AGENT')")
    public ApiResponse listWidgets(@RequestParam UUID tenantId) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Widgets")
                .data(widgetService.listWidgets(tenantId))
                .build();
    }

    @PostMapping("/widgets/{widgetId}/events")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','USER','WIDGET_CLIENT')")
    public ApiResponse trackEvent(@PathVariable UUID widgetId, @Valid @RequestBody TrackEventRequest request) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Event tracked")
                .data(widgetService.trackEvent(widgetId, request))
                .build();
    }

    @GetMapping("/widgets/{widgetId}/events")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','AGENT')")
    public ApiResponse latestEvents(@PathVariable UUID widgetId) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Events")
                .data(widgetService.latestEvents(widgetId))
                .build();
    }

    @PostMapping("/widgets/{widgetId}/domains")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public ApiResponse addDomain(@PathVariable UUID widgetId, @Valid @RequestBody AddDomainRequest request) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Domain added")
                .data(widgetService.addDomain(widgetId, request))
                .build();
    }

    @GetMapping("/widgets/{widgetId}/domains")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public ApiResponse listDomains(@PathVariable UUID widgetId) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Domains")
                .data(widgetService.listDomains(widgetId))
                .build();
    }

    @PostMapping("/widgets/{widgetId}/api-keys")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public ApiResponse createApiKey(@PathVariable UUID widgetId, @RequestBody CreateApiKeyRequest request) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("API key created")
                .data(widgetService.createApiKey(widgetId, request))
                .build();
    }

    @GetMapping("/widgets/{widgetId}/api-keys")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public ApiResponse listApiKeys(@PathVariable UUID widgetId) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("API keys")
                .data(widgetService.listApiKeys(widgetId))
                .build();
    }

    @PostMapping("/widgets/{widgetId}/sessions")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','USER','WIDGET_CLIENT')")
    public ApiResponse createSession(@PathVariable UUID widgetId, @Valid @RequestBody CreateWidgetSessionRequest request) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Session created")
                .data(widgetService.createSession(widgetId, request))
                .build();
    }

    @GetMapping("/widgets/{widgetId}/sessions")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','AGENT')")
    public ApiResponse listSessions(@PathVariable UUID widgetId) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Sessions")
                .data(widgetService.listSessions(widgetId))
                .build();
    }

    @DeleteMapping("/widget-sessions/{sessionId}")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','AGENT')")
    public ApiResponse endSession(@PathVariable UUID sessionId) {
        widgetService.endSession(sessionId);
        return ApiResponse.builder()
                .status(HttpStatus.NO_CONTENT.value())
                .message("Session ended")
                .build();
    }
}
