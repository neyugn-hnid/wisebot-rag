package vandinh.wisebot.userservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import vandinh.wisebot.userservice.common.response.ApiResponse;
import vandinh.wisebot.userservice.config.InternalApiProperties;
import vandinh.wisebot.userservice.dto.request.SystemSettingUpsertRequest;
import vandinh.wisebot.userservice.service.SystemSettingService;

@RestController
@RequestMapping("internal/system-settings")
@RequiredArgsConstructor
public class InternalSystemSettingController {

    private final SystemSettingService systemSettingService;
    private final InternalApiProperties internalApiProperties;

    @GetMapping("/{key}")
    public ApiResponse getSetting(
            @PathVariable String key,
            @RequestHeader(name = "X-Internal-Api-Key", required = false) String apiKey
    ) {
        assertInternalApiKey(apiKey);
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("System setting")
                .data(systemSettingService.getByKey(key))
                .build();
    }

    @PutMapping("/{key}")
    public ApiResponse upsertSetting(
            @PathVariable String key,
            @Valid @RequestBody SystemSettingUpsertRequest request,
            @RequestHeader(name = "X-Internal-Api-Key", required = false) String apiKey
    ) {
        assertInternalApiKey(apiKey);
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("System setting updated")
                .data(systemSettingService.upsert(key, request.getValue(), request.getDescription(), null))
                .build();
    }

    private void assertInternalApiKey(String apiKey) {
        if (apiKey == null || apiKey.isBlank() || !apiKey.equals(internalApiProperties.getApiKey())) {
            throw new ResponseStatusException(HttpStatusCode.valueOf(HttpStatus.FORBIDDEN.value()), "Invalid internal api key");
        }
    }
}
