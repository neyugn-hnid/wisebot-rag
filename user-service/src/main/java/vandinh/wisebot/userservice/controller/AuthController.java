package vandinh.wisebot.userservice.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import vandinh.wisebot.userservice.common.response.ApiResponse;
import vandinh.wisebot.userservice.common.response.TokenResponse;
import vandinh.wisebot.userservice.dto.request.LoginRequest;
import vandinh.wisebot.userservice.dto.request.RegisterRequest;
import vandinh.wisebot.userservice.service.AuthService;

@RestController
@RequestMapping("/auth")
@Tag(name = "Authentication Controller")
@Slf4j(topic = "AUTHENTICATION-CONTROLLER")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @Operation(summary = "Login", description = "Get access token and refresh token by username/email and password")
    @PostMapping("/login")
    public TokenResponse login(@RequestBody LoginRequest request) {
        log.info("Login request with payload: {}", request);
        return authService.login(request);
    }

    @Operation(summary = "Register", description = "Create new account")
    @PostMapping("/register")
    public ApiResponse register(@RequestBody @Valid RegisterRequest request) {
        log.info("Register request: {}", request.getEmail());
        authService.register(request);
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("User registered successfully")
                .data(null)
                .build();
    }

}
