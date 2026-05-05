package vandinh.wisebot.widgetservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vandinh.wisebot.widgetservice.common.response.ApiResponse;
import vandinh.wisebot.widgetservice.dto.request.CreateWidgetSessionRequest;
import vandinh.wisebot.widgetservice.dto.request.TrackEventRequest;
import vandinh.wisebot.widgetservice.service.WidgetService;

@RestController
@RequestMapping("/public/widgets")
@RequiredArgsConstructor
public class PublicWidgetController {

    private final WidgetService widgetService;

    @GetMapping("/code/{code}")
    public ApiResponse getPublicWidget(@PathVariable String code) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Thông tin widget công khai")
                .data(widgetService.getPublicWidgetByCode(code))
                .build();
    }

    @PostMapping("/code/{code}/sessions")
    public ApiResponse createPublicSession(@PathVariable String code, @Valid @RequestBody CreateWidgetSessionRequest request) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Phiên làm việc công khai đã được tạo")
                .data(widgetService.createPublicSession(code, request))
                .build();
    }

    @PostMapping("/code/{code}/events")
    public ApiResponse trackPublicEvent(@PathVariable String code, @Valid @RequestBody TrackEventRequest request) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Event đã được ghi nhận")
                .data(widgetService.trackPublicEvent(code, request))
                .build();
    }
}
