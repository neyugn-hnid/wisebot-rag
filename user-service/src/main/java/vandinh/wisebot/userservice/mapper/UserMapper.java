package vandinh.wisebot.userservice.mapper;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;
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
                .role(resolvePrimaryRole(user))
                .status(user.getStatus())
                .lastLogin(user.getLastLogin())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private String resolvePrimaryRole(UserEntity user) {
        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            return "USER";
        }

        return user.getRoles().stream()
                .map(Role::getName)
                .map(Enum::name)
                .sorted((left, right) -> Integer.compare(priorityOf(left), priorityOf(right)))
                .findFirst()
                .orElse("USER");
    }

    private int priorityOf(String roleName) {
        return switch (roleName) {
            case "ADMIN" -> 0;
            case "OWNER" -> 1;
            default -> 2;
        };
    }
}
