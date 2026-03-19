package vandinh.wisebot.userservice.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vandinh.wisebot.userservice.common.response.TokenResponse;
import vandinh.wisebot.userservice.dto.request.SignInRequest;
import vandinh.wisebot.userservice.service.AuthService;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication Controller")
@Slf4j(topic = "AUTHENTICATION-CONTROLLER")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @Operation(summary = "Access token", description = "Get access token and refresh token by username/email and password")
    @PostMapping("/login")
    public TokenResponse accessToken(@RequestBody SignInRequest request) {
        log.info("Access token request");
        log.info("Access token request with payload: {}", request);
        return authService.login(request);
    }
}
