package vandinh.wisebot.userservice.mapper;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;
import vandinh.wisebot.userservice.common.enums.RoleName;
import vandinh.wisebot.userservice.dto.response.UserPageResponse;
import vandinh.wisebot.userservice.dto.response.UserResponse;
import vandinh.wisebot.userservice.entity.Role;
import vandinh.wisebot.userservice.entity.UserEntity;

import java.util.List;

@Component
public class UserMapper {

    public UserPageResponse toUserPageResponse(Page<UserEntity> entityPage, int page, int size) {
        List<UserResponse> users = entityPage.stream()
                .map(this::toUserResponse)
                .toList();

        return UserPageResponse.builder()
                .pageNumber(page)
                .pageSize(size)
                .totalElements(entityPage.getTotalElements())
                .totalPages(entityPage.getTotalPages())
                .users(users)
                .build();
    }

    public UserResponse toUserResponse(UserEntity user) {
        if (user == null) return null;
        return UserResponse.builder()
                .id(user.getId())
                .avatarUrl(user.getAvatarUrl())
                .fullName(user.getFullName())
                .username(user.getUsername())
                .email(user.getEmail())
                .phone(user.getPhone())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
