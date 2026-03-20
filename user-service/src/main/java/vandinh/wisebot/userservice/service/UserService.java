package vandinh.wisebot.userservice.service;

import vandinh.wisebot.userservice.dto.response.UserResponse;

public interface UserService {
    UserResponse getUserByUsername(String username);
    UserResponse getProfile(String email);
}
