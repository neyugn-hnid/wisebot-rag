package vandinh.wisebot.userservice.service;

import vandinh.wisebot.userservice.common.response.TokenResponse;
import vandinh.wisebot.userservice.dto.request.LoginRequest;
import vandinh.wisebot.userservice.dto.request.RegisterRequest;

public interface AuthService {
    TokenResponse login (LoginRequest request);
    void register(RegisterRequest request);
}
