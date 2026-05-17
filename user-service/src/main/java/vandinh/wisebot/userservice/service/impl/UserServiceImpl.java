package vandinh.wisebot.userservice.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import vandinh.wisebot.userservice.common.enums.RoleName;
import vandinh.wisebot.userservice.common.enums.UserStatus;
import vandinh.wisebot.userservice.dto.request.AdminUserUpdateRequest;
import vandinh.wisebot.userservice.dto.request.ChangePasswordRequest;
import vandinh.wisebot.userservice.dto.request.ChangeStatusRequest;
import vandinh.wisebot.userservice.dto.request.EmailUpdateRequest;
import vandinh.wisebot.userservice.dto.request.UserUpdateRequest;
import vandinh.wisebot.userservice.entity.Role;
import vandinh.wisebot.userservice.dto.response.UserListStatsResponse;
import vandinh.wisebot.userservice.dto.response.UserPageResponse;
import vandinh.wisebot.userservice.dto.response.UserResponse;
import vandinh.wisebot.userservice.entity.UserEntity;
import vandinh.wisebot.userservice.exception.InvalidDataException;
import vandinh.wisebot.userservice.exception.ResourceNotFoundException;
import vandinh.wisebot.userservice.mapper.UserMapper;
import vandinh.wisebot.userservice.repository.RoleRepository;
import vandinh.wisebot.userservice.repository.UserRepository;
import vandinh.wisebot.userservice.service.UserService;
import vandinh.wisebot.userservice.util.AppUtils;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;


@Service
@RequiredArgsConstructor
@Slf4j(topic = "USER-SERVICE")
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;

    @Override
    public UserPageResponse getAllUser(String keyword, String role, String status, String sort, int page, int size) {

        Sort.Order order = AppUtils.getSortOrder(sort);
        Pageable pageable = PageRequest.of(Math.max(page - 1, 0), size, Sort.by(order));
        RoleName roleName = parseRole(role);
        UserStatus userStatus = parseStatus(status);
        String normalizedKeyword = StringUtils.hasText(keyword) ? keyword.trim() : null;
        Page<UserEntity> entityPage = userRepository.searchUsers(normalizedKeyword, roleName, userStatus, pageable);
        long adminCount = roleName == null
                ? userRepository.countUsers(normalizedKeyword, RoleName.ADMIN, userStatus)
                : roleName == RoleName.ADMIN ? entityPage.getTotalElements() : 0;
        long activeCount = userStatus == null || userStatus == UserStatus.ACTIVE
                ? userRepository.countUsers(normalizedKeyword, roleName, UserStatus.ACTIVE)
                : 0;
        long suspendedCount = userStatus == null || userStatus == UserStatus.DISABLED
                ? userRepository.countUsers(normalizedKeyword, roleName, UserStatus.DISABLED)
                : 0;

        UserPageResponse response = userMapper.toUserPageResponse(entityPage, page, size);
        response.setStats(UserListStatsResponse.builder()
                .total(entityPage.getTotalElements())
                .admins(adminCount)
                .active(activeCount)
                .suspended(suspendedCount)
                .build());
        return response;
    }

    @Transactional
    @Override
    @Cacheable(cacheNames = "user-by-id", key = "#id")
    public UserResponse getUserById(UUID id) {
        UserEntity userEntity = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Người dùng không tồn tại với ID: " + id));
        return userMapper.toUserResponse(userEntity);
    }

    @Transactional
    @Override
    @Cacheable(cacheNames = "user-by-id", key = "#id")
    public UserResponse getProfile(UUID id) {
        return getUserById(id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    @CacheEvict(cacheNames = "user-by-id", key = "#id")
    public void adminUpdateUser(AdminUserUpdateRequest request, UUID id) {
        UserEntity user = getUserEntity(id);

        if (StringUtils.hasText(request.getFullName())) {
            user.setFullName(request.getFullName().trim());
        }

        if (StringUtils.hasText(request.getPhone())) {
            user.setPhone(request.getPhone().trim());
        }

        if (StringUtils.hasText(request.getEmail())) {
            String normalizedEmail = request.getEmail().trim();
            Optional<UserEntity> existingUser = userRepository.findByEmail(normalizedEmail);
            if (existingUser.isPresent() && !existingUser.get().getId().equals(id)) {
                throw new InvalidDataException("Email đã tồn tại");
            }
            user.setEmail(normalizedEmail);
        }

        if (request.getStatus() != null) {
            user.setStatus(request.getStatus());
        }

        if (StringUtils.hasText(request.getRole())) {
            RoleName roleName;
            try {
                roleName = RoleName.valueOf(request.getRole().trim().toUpperCase());
            } catch (IllegalArgumentException exception) {
                throw new InvalidDataException("Vai trò không hợp lệ");
            }

            Role role = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new ResourceNotFoundException("Vai trò không tồn tại: " + roleName));
            user.setRoles(Set.of(role));
        }

        userRepository.save(user);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    @CacheEvict(cacheNames = "user-by-id", key = "#id")
    public void updateUser(UserUpdateRequest request, UUID id) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại với ID: " + id));

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }

        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        userRepository.save(user);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    @CacheEvict(cacheNames = "user-by-id", key = "#id")
    public void updateEmail(EmailUpdateRequest request, UUID id) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại với ID: " + id));

        if (request.getNewEmail() != null){
            user.setEmail(request.getNewEmail());
        }
        userRepository.save(user);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    @CacheEvict(cacheNames = "user-by-id", key = "#id")
    public void changeStatus(ChangeStatusRequest request, UUID id, UUID actorId) {
        if (id.equals(actorId)) {
            throw new InvalidDataException("Không thể tự thay đổi trạng thái của chính mình");
        }

        UserEntity user = getUserEntity(id);
        user.setStatus(request.getNewStatus());
        userRepository.save(user);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    @CacheEvict(cacheNames = "user-by-id", key = "#id")
    public void changePassword(ChangePasswordRequest request, UUID id) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại với ID: " + id));

        if(!passwordEncoder.matches(request.getCurrentPassword(),user.getPassword())){
            throw new InvalidDataException("Mật khẩu hiện tại không đúng");
        }

        if (!request.getNewPassword().equals(request.getConfirmNewPassword())){
            throw new InvalidDataException("Mật khẩu mới và xác nhận mật khẩu không khớp");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    @CacheEvict(cacheNames = "user-by-id", key = "#id")
    public void deleteUser(UUID id, UUID actorId) {
        if (id.equals(actorId)) {
            throw new InvalidDataException("Không thể tự xóa chính mình");
        }

        UserEntity user = getUserEntity(id);
        userRepository.delete(user);
    }

    private UserEntity getUserEntity(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại với ID: " + id));
    }

    private RoleName parseRole(String role) {
        if (!StringUtils.hasText(role)) {
            return null;
        }

        try {
            return RoleName.valueOf(role.trim().toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw new InvalidDataException("Vai trò không hợp lệ");
        }
    }

    private UserStatus parseStatus(String status) {
        if (!StringUtils.hasText(status)) {
            return null;
        }

        try {
            return UserStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw new InvalidDataException("Trạng thái không hợp lệ");
        }
    }
}
