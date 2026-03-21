package vandinh.wisebot.userservice.service;

import vandinh.wisebot.userservice.dto.request.ChangePasswordRequest;
import vandinh.wisebot.userservice.dto.request.ChangeStatusRequest;
import vandinh.wisebot.userservice.dto.request.EmailUpdateRequest;
import vandinh.wisebot.userservice.dto.request.UserUpdateRequest;
import vandinh.wisebot.userservice.dto.response.UserPageResponse;
import vandinh.wisebot.userservice.dto.response.UserResponse;

public interface UserService {
    UserPageResponse getAllUser(String keyword, String sort, int page, int size);
    UserResponse getUserById(Long id);
    UserResponse getProfile(Long id);
    void updateUser(UserUpdateRequest request, Long id);
    void updateEmail(EmailUpdateRequest request, Long id);
    void changeStatus(ChangeStatusRequest request, Long id);
    void changePassword(ChangePasswordRequest request, Long id);

}
