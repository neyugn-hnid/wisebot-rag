package vandinh.wisebot.userservice.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vandinh.wisebot.userservice.common.response.ApiResponse;
import vandinh.wisebot.userservice.service.UserService;

@RestController
@RequestMapping("user")
@Tag(name = "User Controller")
@Slf4j(topic = "USER-CONTROLLER")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @Operation(summary = "Get profile", description = "API retrieve profile of user")
    @GetMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse getProfile(Authentication authentication) {
        String email = authentication.getName();
        log.info("Get profile of user: {}", email);
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("User profile retrieved successfully")
                .data(userService.getProfile(email))
                .build();
    }
}
