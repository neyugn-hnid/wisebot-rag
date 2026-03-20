package vandinh.wisebot.userservice.mapper;

import org.springframework.stereotype.Component;
import vandinh.wisebot.userservice.common.enums.RoleName;
import vandinh.wisebot.userservice.dto.response.UserResponse;
import vandinh.wisebot.userservice.entity.Role;
import vandinh.wisebot.userservice.entity.UserEntity;

import java.util.List;

@Component
public class UserMapper {
    public UserResponse toUserResponse(UserEntity user) {
        if (user == null) return null;
        return UserResponse.builder()
                .id(user.getId())
                .avatarUrl(user.getAvatarUrl())
                .fullName(user.getFullName())
                .usename(user.getUsername())
                .email(user.getEmail())
                .phone(user.getPhone())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
