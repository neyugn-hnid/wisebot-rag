package vandinh.wisebot.userservice.service;

import vandinh.wisebot.userservice.common.response.TokenResponse;
import vandinh.wisebot.userservice.dto.request.LoginRequest;
import vandinh.wisebot.userservice.dto.request.RefreshTokenRequest;
import vandinh.wisebot.userservice.dto.request.RegisterRequest;
import vandinh.wisebot.userservice.dto.request.VerifyEmailRequest;
import vandinh.wisebot.userservice.common.response.ApiResponse;
import vandinh.wisebot.userservice.dto.request.ForgotPasswordRequest;

import java.util.UUID;

public interface AuthService {
    TokenResponse login (LoginRequest request);
    TokenResponse refreshToken(RefreshTokenRequest request);
    void register(RegisterRequest request);
    ApiResponse verifyEmail(VerifyEmailRequest request);
    ApiResponse resendVerificationEmail(String email);
    ApiResponse logout(String authorizationHeader);
    ApiResponse inviteUser(UUID tenantId, String email);

    ApiResponse sendResetPasswordOtp(ForgotPasswordRequest request);

    ApiResponse resetPassword(ForgotPasswordRequest request);
}
