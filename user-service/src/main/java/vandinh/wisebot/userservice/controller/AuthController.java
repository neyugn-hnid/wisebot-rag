package vandinh.wisebot.userservice.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import vandinh.wisebot.userservice.common.response.ApiResponse;
import vandinh.wisebot.userservice.common.response.TokenResponse;
import vandinh.wisebot.userservice.dto.request.InviteRequest;
import vandinh.wisebot.userservice.dto.request.LoginRequest;
import vandinh.wisebot.userservice.dto.request.RefreshTokenRequest;
import vandinh.wisebot.userservice.dto.request.RegisterRequest;
import vandinh.wisebot.userservice.dto.request.VerifyEmailRequest;
import vandinh.wisebot.userservice.dto.request.ForgotPasswordRequest;
import vandinh.wisebot.userservice.entity.UserEntity;
import vandinh.wisebot.userservice.service.AuthService;

import static org.springframework.http.HttpHeaders.AUTHORIZATION;

@RestController
@RequestMapping("/auth")
@Tag(name = "Authentication Controller")
@Slf4j(topic = "AUTHENTICATION-CONTROLLER")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @Operation(summary = "Login", description = "Xác thực người dùng và trả về mã truy cập và mã làm mới.")
    @PostMapping("/login")
    public TokenResponse login(@RequestBody @Valid LoginRequest request) {
        log.info("Yêu cầu đăng nhập: {}", request);
        return authService.login(request);
    }

    @Operation(summary = "Refresh token", description = "Làm mới mã truy cập bằng cách sử dụng mã làm mới hợp lệ.")
    @PostMapping("/refresh")
    public TokenResponse refresh(@RequestBody @Valid RefreshTokenRequest request) {
        log.info("Yêu cầu làm mới token: {}", request);
        return authService.refreshToken(request);
    }

    @Operation(summary = "Register", description = "Tạo tài khoản mới cho người dùng.")
    @PostMapping("/register")
    public ApiResponse register(@RequestBody @Valid RegisterRequest request) {
        log.info("Yêu cầu đăng ký: {}", request.getEmail());
        authService.register(request);
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
            .message("Đăng ký tài khoản thành công. Vui lòng kiểm tra email để lấy OTP xác minh tài khoản")
                .data(null)
                .build();
    }

    @Operation(summary = "Verify email", description = "Xác minh tài khoản bằng OTP trong email")
    @PostMapping("/verify-email")
    public ApiResponse verifyEmail(@RequestBody @Valid VerifyEmailRequest request) {
        return authService.verifyEmail(request);
    }

    @Operation(summary = "Resend verification email", description = "Gửi lại email xác minh chứa OTP mới")
    @PostMapping("/resend-verification")
    public ApiResponse resendVerification(@RequestParam String email) {
        return authService.resendVerificationEmail(email);
    }

    @Operation(summary = "Logout", description = "Thu hồi mã truy cập bằng cách thêm nó vào danh sách đen.")
    @PostMapping("/logout")
    public ApiResponse logout(@RequestHeader(value = AUTHORIZATION, required = false) String authorizationHeader) {
        return authService.logout(authorizationHeader);
    }

    @Operation(summary = "Invite user", description = "Tạo mã mời cho người dùng để tham gia tenant")
    @PostMapping("/invite")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse invite(@RequestBody @Valid InviteRequest request, Authentication authentication) {
        UserEntity user = (UserEntity) authentication.getPrincipal();
        return authService.inviteUser(user.getTenant().getId(), request.getEmail());
    }

    @Operation(summary = "Forgot password - send OTP", description = "Gửi OTP đặt lại mật khẩu qua email")
    @PostMapping("/forgot-password")
    public ApiResponse forgotPassword(@RequestBody @Valid ForgotPasswordRequest request) {
        log.info("Yêu cầu gửi OTP đặt lại mật khẩu: {}", request.getEmail());
        return authService.sendResetPasswordOtp(request);
    }

    @Operation(summary = "Verify reset password OTP", description = "Xác minh OTP đặt lại mật khẩu trước khi cho phép nhập mật khẩu mới")
    @PostMapping("/verify-reset-password-otp")
    public ApiResponse verifyResetPasswordOtp(@RequestBody @Valid ForgotPasswordRequest request) {
        log.info("Yêu cầu xác minh OTP đặt lại mật khẩu: {}", request.getEmail());
        return authService.verifyResetPasswordOtp(request);
    }

    @Operation(summary = "Reset password", description = "Xác minh OTP và đặt lại mật khẩu mới")
    @PostMapping("/reset-password")
    public ApiResponse resetPassword(@RequestBody @Valid ForgotPasswordRequest request) {
        log.info("Yêu cầu đặt lại mật khẩu: {}", request.getEmail());
        return authService.resetPassword(request);
    }

}
