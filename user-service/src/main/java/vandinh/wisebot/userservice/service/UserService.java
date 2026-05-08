package vandinh.wisebot.userservice.service;

import vandinh.wisebot.userservice.dto.request.ChangePasswordRequest;
import vandinh.wisebot.userservice.dto.request.ChangeStatusRequest;
import vandinh.wisebot.userservice.dto.request.EmailUpdateRequest;
import vandinh.wisebot.userservice.dto.request.AdminUserUpdateRequest;
import vandinh.wisebot.userservice.dto.request.UserUpdateRequest;
import vandinh.wisebot.userservice.dto.response.UserPageResponse;
import vandinh.wisebot.userservice.dto.response.UserResponse;

import java.util.UUID;

public interface UserService {
    UserPageResponse getAllUser(String keyword, String role, String status, String sort, int page, int size);
    UserResponse getUserById(UUID id);
    UserResponse getProfile(UUID id);
    void adminUpdateUser(AdminUserUpdateRequest request, UUID id);
    void updateUser(UserUpdateRequest request, UUID id);
    void updateEmail(EmailUpdateRequest request, UUID id);
    void changeStatus(ChangeStatusRequest request, UUID id, UUID actorId);
    void changePassword(ChangePasswordRequest request, UUID id);
    void deleteUser(UUID id, UUID actorId);

}
