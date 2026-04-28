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
    public UserPageResponse getAllUser(String keyword, String sort, int page, int size) {
        log.info("Fetching all users, page: {}, size: {}, keyword: {}", page, size, keyword);

        Sort.Order order = AppUtils.getSortOrder(sort);
        Pageable pageable = PageRequest.of(Math.max(page - 1, 0), size, Sort.by(order));
        Page<UserEntity> entityPage = StringUtils.hasLength(keyword)
                ? userRepository.searchByKeyword("%" + keyword + "%", pageable)
                : userRepository.findAll(pageable);

        return userMapper.toUserPageResponse(entityPage, page, size);
    }

    @Transactional
    @Override
    @Cacheable(cacheNames = "user-by-id", key = "#id")
    public UserResponse getUserById(UUID id) {
        UserEntity userEntity = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found with id: " + id));
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
                    .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleName));
            user.setRoles(Set.of(role));
        }

        userRepository.save(user);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    @CacheEvict(cacheNames = "user-by-id", key = "#id")
    public void updateUser(UserUpdateRequest request, UUID id) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

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
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (request.getNewEmail() != null){
            user.setEmail(request.getNewEmail());
        }
        userRepository.save(user);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    @CacheEvict(cacheNames = "user-by-id", key = "#id")
    public void changeStatus(ChangeStatusRequest request, UUID id) {
        UserEntity user = getUserEntity(id);
        user.setStatus(request.getNewStatus());
        userRepository.save(user);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    @CacheEvict(cacheNames = "user-by-id", key = "#id")
    public void changePassword(ChangePasswordRequest request, UUID id) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if(!passwordEncoder.matches(request.getCurrentPassword(),user.getPassword())){
            throw new InvalidDataException("Current password is incorrect");
        }

        if (!request.getNewPassword().equals(request.getConfirmNewPassword())){
            throw new InvalidDataException("New password and confirm password do not match");
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
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }
}
