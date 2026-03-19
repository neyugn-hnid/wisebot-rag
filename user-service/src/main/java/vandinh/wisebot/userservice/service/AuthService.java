package vandinh.wisebot.userservice.service;

import vandinh.wisebot.userservice.common.response.TokenResponse;
import vandinh.wisebot.userservice.dto.request.SignInRequest;

public interface AuthService {
    TokenResponse login (SignInRequest request);

}
