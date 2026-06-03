package vandinh.wisebot.widgetservice.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vandinh.wisebot.widgetservice.common.response.ApiResponse;
import vandinh.wisebot.widgetservice.service.WidgetService;

@RestController
@RequestMapping("/internal")
@RequiredArgsConstructor
public class InternalApiController {

    private final WidgetService widgetService;

    @PostMapping("/api-keys/validate")
    public ApiResponse validateApiKey(@RequestHeader("X-API-Key") String apiKey) {
        var widget = widgetService.validateApiKey(apiKey);
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("API key valid")
                .data(widget)
                .build();
    }
}
