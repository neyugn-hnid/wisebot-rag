package vandinh.wisebot.userservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vandinh.wisebot.userservice.common.response.ApiResponse;
import vandinh.wisebot.userservice.dto.request.SystemSettingUpsertRequest;
import vandinh.wisebot.userservice.entity.UserEntity;
import vandinh.wisebot.userservice.service.SystemSettingService;

@RestController
@RequestMapping("admin/system-settings")
@RequiredArgsConstructor
public class AdminSystemSettingController {

    private final SystemSettingService systemSettingService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    public ApiResponse listSettings() {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("System settings")
                .data(systemSettingService.listAll())
                .build();
    }

    @GetMapping("/{key}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    public ApiResponse getSetting(@PathVariable String key) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("System setting")
                .data(systemSettingService.getByKey(key))
                .build();
    }

    @PutMapping("/{key}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    public ApiResponse upsertSetting(
            @PathVariable String key,
            @Valid @RequestBody SystemSettingUpsertRequest request,
            Authentication authentication
    ) {
        UserEntity user = (UserEntity) authentication.getPrincipal();
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("System setting updated")
                .data(systemSettingService.upsert(key, request.getValue(), request.getDescription(), user.getId()))
                .build();
    }
}
