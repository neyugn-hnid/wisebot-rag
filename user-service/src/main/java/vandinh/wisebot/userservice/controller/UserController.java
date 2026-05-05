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

    @Operation(summary = "Get all user", description = "API truy xuất danh sách người dùng với phân trang và bộ lọc.")
    @GetMapping("/list")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    public ApiResponse getList(@RequestParam(required = false) String keyword,
                               @RequestParam(required = false) String role,
                               @RequestParam(required = false) String status,
                               @RequestParam(required = false) String sort,
                               @RequestParam(defaultValue = "0") int page,
                               @RequestParam(defaultValue = "20") int size) {
        log.info("Lấy danh sách người dùng với keyword: {}, role: {}, status: {}, sort: {}, page: {}, size: {}",
                keyword, role, status, sort, page, size);
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("users")
                .data(userService.getAllUser(keyword, role, status, sort, page, size))
                .build();
    }

    @Operation(summary = "Get user", description = "API truy xuất thông tin người dùng theo ID.")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    public ApiResponse getUser(@PathVariable UUID id) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Thông tin người dùng")
                .data(userService.getUserById(id))
                .build();
    }

    @Operation(summary = "Admin update user", description = "API cập nhật thông tin người dùng bởi admin.")
    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    public ApiResponse adminUpdateUser(@PathVariable UUID id, @RequestBody @Valid AdminUserUpdateRequest request) {
        userService.adminUpdateUser(request, id);
        return ApiResponse.builder()
                .status(HttpStatus.NO_CONTENT.value())
                .message("Người dùng đã được cập nhật thành công")
                .build();
    }

    @Operation(summary = "Get profile", description = "API truy xuất hồ sơ người dùng")
    @GetMapping("/profile")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_OWNER','ROLE_USER')")
    public ApiResponse getProfile(Authentication authentication) {
        UserEntity user = (UserEntity) authentication.getPrincipal();
        log.info("Get profile of userId: {}", user.getId());
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Thông tin người dùng đã được truy xuất thành công")
                .data(userService.getProfile(user.getId()))
                .build();
    }


    @Operation(summary = "Update profile", description = "API cập nhật hồ sơ người dùng")
    @PatchMapping("/update-profile")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse updateProfile(@RequestBody @Valid UserUpdateRequest request, Authentication authentication) {
        UserEntity user = (UserEntity) authentication.getPrincipal();
        userService.updateUser(request, user.getId());
        return ApiResponse.builder()
                .status(HttpStatus.NO_CONTENT.value())
                .message("Hồ sơ người dùng đã được cập nhật thành công")
                .build();
    }

    @Operation(summary = "Update email", description = "API cập nhật email của người dùng")
    @PatchMapping("/update-email")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse updateEmail(@RequestBody @Valid EmailUpdateRequest request, Authentication authentication) {
        UserEntity user = (UserEntity) authentication.getPrincipal();
        userService.updateEmail(request, user.getId());
        return ApiResponse.builder()
                .status(HttpStatus.NO_CONTENT.value())
                .message("Email đã được cập nhật thành công")
                .build();
    }

    @Operation(summary = "Change status", description = "API thay đổi trạng thái người dùng (active/inactive) bởi admin")
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
                .message("Trạng thái đã được thay đổi thành công")
                .build();
    }

    @Operation(summary = "Change password", description = "API thay đổi mật khẩu của người dùng")
    @PatchMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse changePassword(@RequestBody @Valid ChangePasswordRequest request, Authentication authentication) {
        UserEntity user = (UserEntity) authentication.getPrincipal();
        userService.changePassword(request, user.getId());
        return ApiResponse.builder()
                .status(HttpStatus.NO_CONTENT.value())
                .message("Mật khẩu đã được thay đổi thành công")
                .build();
    }

    @Operation(summary = "Delete user", description = "API xóa người dùng bởi admin")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    public ApiResponse deleteUser(@PathVariable UUID id, Authentication authentication) {
        UserEntity user = (UserEntity) authentication.getPrincipal();
        userService.deleteUser(id, user.getId());
        return ApiResponse.builder()
                .status(HttpStatus.NO_CONTENT.value())
                .message("Người dùng đã được xóa thành công")
                .build();
    }

}
