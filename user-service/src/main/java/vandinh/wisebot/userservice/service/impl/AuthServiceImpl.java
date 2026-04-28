package vandinh.wisebot.userservice.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vandinh.wisebot.userservice.common.enums.LoginProvider;
import vandinh.wisebot.userservice.common.enums.RoleName;
import vandinh.wisebot.userservice.common.enums.TenantPlan;
import vandinh.wisebot.userservice.common.enums.UserStatus;
import vandinh.wisebot.userservice.common.enums.InviteStatus;
import vandinh.wisebot.userservice.common.response.ApiResponse;
import vandinh.wisebot.userservice.common.response.TokenResponse;
import vandinh.wisebot.userservice.dto.request.LoginRequest;
import vandinh.wisebot.userservice.dto.request.RefreshTokenRequest;
import vandinh.wisebot.userservice.dto.request.RegisterRequest;
import vandinh.wisebot.userservice.entity.Role;
import vandinh.wisebot.userservice.entity.Tenant;
import vandinh.wisebot.userservice.entity.TenantInvite;
import vandinh.wisebot.userservice.entity.UserEntity;
import vandinh.wisebot.userservice.exception.InvalidDataException;
import vandinh.wisebot.userservice.repository.RoleRepository;
import vandinh.wisebot.userservice.repository.TenantInviteRepository;
import vandinh.wisebot.userservice.repository.TenantRepository;
import vandinh.wisebot.userservice.repository.UserRepository;
import vandinh.wisebot.userservice.service.AuthService;
import vandinh.wisebot.userservice.service.JwtService;
import vandinh.wisebot.userservice.service.security.JwtBlacklistService;
import org.springframework.http.HttpStatus;

import java.util.Date;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static vandinh.wisebot.userservice.common.enums.TokenType.REFRESH_TOKEN;

@Service
@RequiredArgsConstructor
@Slf4j(topic = "AUTH-SERVICE")
public class AuthServiceImpl implements AuthService {
    private final JwtService jwtService;
    private final JwtBlacklistService jwtBlacklistService;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final TenantInviteRepository tenantInviteRepository;
    private final TenantRepository tenantRepository;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TokenResponse login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );

            log.info("Login success for account {}", request.getUsername());
            SecurityContextHolder.getContext().setAuthentication(authentication);

            if (!(authentication.getPrincipal() instanceof UserEntity user)) {
                throw new UsernameNotFoundException("Không tìm thấy người dùng");
            }

            user.setLoginProvider(LoginProvider.LOCAL);
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);

            List<String> authorities = authentication.getAuthorities()
                    .stream()
                    .map(a -> a.getAuthority())
                    .toList();

            UUID userId = user.getId();
            UUID tenantId = user.getTenant() != null ? user.getTenant().getId() : null;
            String accessToken = jwtService.generateAccessToken(userId, tenantId, user.getEmail(), authorities);
            String refreshToken = jwtService.generateRefreshToken(userId, tenantId, user.getEmail(), authorities);

            return TokenResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .build();

        } catch (BadCredentialsException e) {
            log.warn("Password incorrect for user: {}", request.getUsername());
            throw new BadCredentialsException("Sai tài khoản hoặc mật khẩu");

        } catch (InternalAuthenticationServiceException e) {
            log.warn("User does not exist: {}", request.getUsername());

            if (e.getCause() instanceof UsernameNotFoundException) {
                throw new BadCredentialsException("Sai tài khoản hoặc mật khẩu");
            }

            throw new RuntimeException("Lỗi hệ thống khi xác thực", e);
        } catch (DisabledException e) {
            throw new DisabledException("Tài khoản đã bị vô hiệu hóa");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public TokenResponse refreshToken(RefreshTokenRequest request) {
        try {
            UUID userId = jwtService.extractUserId(request.getRefreshToken(), REFRESH_TOKEN);
            String email = jwtService.extractEmail(request.getRefreshToken(), REFRESH_TOKEN);

            if (userId == null || email == null || email.isBlank()) {
                throw new BadCredentialsException("Refresh token không hợp lệ");
            }

            UserEntity user = userRepository.findById(userId)
                    .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng"));

            if (!user.getEmail().equalsIgnoreCase(email)) {
                throw new BadCredentialsException("Refresh token không hợp lệ");
            }

            List<String> authorities = user.getRoles()
                    .stream()
                    .map(role -> role.getName().name())
                    .toList();

            UUID tenantId = user.getTenant() != null ? user.getTenant().getId() : null;
            return TokenResponse.builder()
                    .accessToken(jwtService.generateAccessToken(user.getId(), tenantId, user.getEmail(), authorities))
                    .refreshToken(jwtService.generateRefreshToken(user.getId(), tenantId, user.getEmail(), authorities))
                    .build();
        } catch (Exception exception) {
            throw new BadCredentialsException("Refresh token không hợp lệ");
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new InvalidDataException("Email đã tồn tại");
        }

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new InvalidDataException("Mật khẩu và xác nhận mật khẩu không khớp");
        }

        Role role = roleRepository.findByName(RoleName.USER)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy vai trò"));

        Tenant tenant;
        if (request.getInviteToken() != null && !request.getInviteToken().isBlank()) {
            TenantInvite invite = tenantInviteRepository
                    .findByTokenAndStatus(request.getInviteToken(), InviteStatus.PENDING)
                    .orElseThrow(() -> new InvalidDataException("Lời mời không hợp lệ"));

            if (invite.getExpiresAt() != null && invite.getExpiresAt().isBefore(LocalDateTime.now())) {
                invite.setStatus(InviteStatus.EXPIRED);
                tenantInviteRepository.save(invite);
                throw new InvalidDataException("Lời mời đã hết hạn");
            }

            if (invite.getEmail() != null && !invite.getEmail().equalsIgnoreCase(request.getEmail())) {
                throw new InvalidDataException("Email lời mời không khớp");
            }

            tenant = invite.getTenant();
            invite.setStatus(InviteStatus.ACCEPTED);
            invite.setAcceptedAt(LocalDateTime.now());
            tenantInviteRepository.save(invite);
        } else {
            tenant = new Tenant();
            tenant.setName(request.getFullName() + "'s Tenant");
            tenant.setPlan(TenantPlan.FREE);
            tenant = tenantRepository.save(tenant);
        }

        String generatedUsername = generateUniqueUsername(request.getEmail());

        UserEntity user = UserEntity.builder()
                .fullName(request.getFullName())
                .username(generatedUsername)
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .status(UserStatus.ACTIVE)
                .roles(Set.of(role))
                .tenant(tenant)
                .isEmailVerified(false)
                .build();
        userRepository.save(user);
    }

    private String generateUniqueUsername(String email) {
        String localPart = email == null ? "" : email.split("@")[0];
        String sanitized = localPart
                .replaceAll("[^a-zA-Z0-9_]", "_")
                .replaceAll("_+", "_")
                .replaceAll("^_+|_+$", "");

        String base = sanitized.isBlank() ? "user" : sanitized;
        if (base.length() > 40) {
            base = base.substring(0, 40);
        }

        String candidate = base;
        int counter = 1;
        while (userRepository.existsByUsername(candidate)) {
            String suffix = "_" + counter++;
            int maxBaseLength = Math.max(1, 40 - suffix.length());
            String shortenedBase = base.length() > maxBaseLength ? base.substring(0, maxBaseLength) : base;
            candidate = shortenedBase + suffix;
        }

        return candidate;
    }

    @Override
    public ApiResponse logout(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            return ApiResponse.builder()
                    .status(HttpStatus.BAD_REQUEST.value())
                    .message("Thiếu Authorization header")
                    .build();
        }

        String token = authorizationHeader.substring(7);
        try {
            Date expiry = jwtService.extractExpiration(token, vandinh.wisebot.userservice.common.enums.TokenType.ACCESS_TOKEN);
            jwtBlacklistService.blacklist(token, expiry);
        } catch (Exception ex) {
            return ApiResponse.builder()
                    .status(HttpStatus.UNAUTHORIZED.value())
                .message("Token không hợp lệ hoặc đã hết hạn")
                    .build();
        }

        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
            .message("Đăng xuất thành công")
                .build();
    }

    @Override
    public ApiResponse inviteUser(UUID tenantId, String email) {
        if (tenantId == null) {
            throw new InvalidDataException("Thiếu tenant");
        }
        if (email == null || email.isBlank()) {
            throw new InvalidDataException("Thiếu email");
        }

        if (userRepository.existsByEmail(email)) {
            throw new InvalidDataException("Email đã tồn tại");
        }

        if (tenantInviteRepository.existsByTenant_IdAndEmailAndStatus(tenantId, email, InviteStatus.PENDING)) {
            throw new InvalidDataException("Lời mời đã được gửi");
        }

        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new InvalidDataException("Không tìm thấy tenant"));

        TenantInvite invite = new TenantInvite();
        invite.setTenant(tenant);
        invite.setEmail(email);
        invite.setToken(UUID.randomUUID().toString());
        invite.setStatus(InviteStatus.PENDING);
        invite.setExpiresAt(LocalDateTime.now().plusDays(7));
        tenantInviteRepository.save(invite);

        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
            .message("Tạo lời mời thành công")
                .data(Map.of(
                        "token", invite.getToken(),
                        "expiresAt", invite.getExpiresAt()
                ))
                .build();
    }
}
