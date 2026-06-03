package vandinh.wisebot.userservice.dto.response;

import lombok.Builder;
import lombok.Data;
import vandinh.wisebot.userservice.common.enums.UserStatus;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class UserResponse {
    private UUID id;
    private String avatarUrl;
    private String fullName;
    private String username;
    private String email;
    private String phone;
    private String role;
    private UserStatus status;
    private LocalDateTime lastLogin;
    private LocalDateTime createdAt;
}
