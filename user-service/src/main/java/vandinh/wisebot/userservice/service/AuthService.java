package vandinh.wisebot.userservice.service;

import vandinh.wisebot.userservice.common.response.TokenResponse;
import vandinh.wisebot.userservice.dto.request.LoginRequest;
import vandinh.wisebot.userservice.dto.request.RegisterRequest;
import vandinh.wisebot.userservice.common.response.ApiResponse;

import java.util.UUID;

public interface AuthService {
    TokenResponse login (LoginRequest request);
    void register(RegisterRequest request);
    ApiResponse logout(String authorizationHeader);
    ApiResponse inviteUser(UUID tenantId, String email);
}
