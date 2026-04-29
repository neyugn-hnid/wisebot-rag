package vandinh.wisebot.userservice.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vandinh.wisebot.userservice.common.response.ApiResponse;
import vandinh.wisebot.userservice.dto.request.ChangePasswordRequest;
import vandinh.wisebot.userservice.dto.request.ChangeStatusRequest;
import vandinh.wisebot.userservice.dto.request.EmailUpdateRequest;
import vandinh.wisebot.userservice.dto.request.AdminUserUpdateRequest;
import vandinh.wisebot.userservice.dto.request.UserUpdateRequest;
import vandinh.wisebot.userservice.entity.UserEntity;
import vandinh.wisebot.userservice.service.UserService;

import java.util.UUID;

@RestController
@RequestMapping("user")
@Tag(name = "User Controller")
@Slf4j(topic = "USER-CONTROLLER")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @Operation(summary = "Get all user", description = "API retrieve list of user")
    @GetMapping("/list")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    public ApiResponse getList(@RequestParam(required = false) String keyword,
                               @RequestParam(required = false) String role,
                               @RequestParam(required = false) String status,
                               @RequestParam(required = false) String sort,
                               @RequestParam(defaultValue = "0") int page,
                               @RequestParam(defaultValue = "20") int size) {
        log.info("Get user list");
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("users")
                .data(userService.getAllUser(keyword, role, status, sort, page, size))
                .build();
    }

    @Operation(summary = "Get user", description = "API retrieve user")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    public ApiResponse getUser(@PathVariable UUID id) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("User profile retrieved successfully")
                .data(userService.getUserById(id))
                .build();
    }

    @Operation(summary = "Admin update user", description = "API update user by admin")
    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    public ApiResponse adminUpdateUser(@PathVariable UUID id, @RequestBody @Valid AdminUserUpdateRequest request) {
        userService.adminUpdateUser(request, id);
        return ApiResponse.builder()
                .status(HttpStatus.NO_CONTENT.value())
                .message("User updated successfully")
                .build();
    }

    @Operation(summary = "Get profile", description = "API retrieve profile of user")
    @GetMapping("/profile")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_OWNER','ROLE_USER')")
    public ApiResponse getProfile(Authentication authentication) {
        UserEntity user = (UserEntity) authentication.getPrincipal();
        log.info("Get profile of userId: {}", user.getId());
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("User profile retrieved successfully")
                .data(userService.getProfile(user.getId()))
                .build();
    }


    @Operation(summary = "Update profile", description = "API update profile of user")
    @PatchMapping("/update-profile")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse updateProfile(@RequestBody @Valid UserUpdateRequest request, Authentication authentication) {
        UserEntity user = (UserEntity) authentication.getPrincipal();
        userService.updateUser(request, user.getId());
        return ApiResponse.builder()
                .status(HttpStatus.NO_CONTENT.value())
                .message("User profile updated successfully")
                .build();
    }

    @Operation(summary = "Update email", description = "API update email of user")
    @PatchMapping("/update-email")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse updateEmail(@RequestBody @Valid EmailUpdateRequest request, Authentication authentication) {
        UserEntity user = (UserEntity) authentication.getPrincipal();
        userService.updateEmail(request, user.getId());
        return ApiResponse.builder()
                .status(HttpStatus.NO_CONTENT.value())
                .message("Email updated successfully")
                .build();
    }

    @Operation(summary = "Change status", description = "API change status of user")
    @PatchMapping("/{id}/change-status")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    public ApiResponse changeStatus(@PathVariable UUID id,
                                    @RequestBody
                                    @Valid
                                    ChangeStatusRequest request,
                                    Authentication authentication) {
        UserEntity user = (UserEntity) authentication.getPrincipal();
        userService.changeStatus(request, id, user.getId());
        return ApiResponse.builder()
                .status(HttpStatus.NO_CONTENT.value())
                .message("Status changed successfully")
                .build();
    }

    @Operation(summary = "Change password", description = "API change password of user")
    @PatchMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse changePassword(@RequestBody @Valid ChangePasswordRequest request, Authentication authentication) {
        UserEntity user = (UserEntity) authentication.getPrincipal();
        userService.changePassword(request, user.getId());
        return ApiResponse.builder()
                .status(HttpStatus.NO_CONTENT.value())
                .message("Password changed successfully")
                .build();
    }

    @Operation(summary = "Delete user", description = "API delete user by admin")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    public ApiResponse deleteUser(@PathVariable UUID id, Authentication authentication) {
        UserEntity user = (UserEntity) authentication.getPrincipal();
        userService.deleteUser(id, user.getId());
        return ApiResponse.builder()
                .status(HttpStatus.NO_CONTENT.value())
                .message("User deleted successfully")
                .build();
    }

}
