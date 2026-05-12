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
import vandinh.wisebot.userservice.dto.request.VerifyEmailRequest;
import vandinh.wisebot.userservice.dto.request.ForgotPasswordRequest;
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
import vandinh.wisebot.userservice.service.EmailService;
import vandinh.wisebot.userservice.service.JwtService;
import vandinh.wisebot.userservice.service.security.JwtBlacklistService;
import org.springframework.http.HttpStatus;

import java.util.Date;

import java.time.LocalDateTime;
import java.security.SecureRandom;
import java.util.Map;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static vandinh.wisebot.userservice.common.enums.TokenType.REFRESH_TOKEN;

@Service
@RequiredArgsConstructor
@Slf4j(topic = "AUTH-SERVICE")
public class AuthServiceImpl implements AuthService {
    private static final String INVALID_CREDENTIALS_MESSAGE = "Email hoặc mật khẩu không đúng.";
    private static final String LOCKED_ACCOUNT_MESSAGE = "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.";
    private static final String UNVERIFIED_ACCOUNT_MESSAGE = "Tài khoản chưa được xác minh. Vui lòng kiểm tra email để lấy OTP.";
    private static final int EMAIL_VERIFICATION_OTP_LENGTH = 6;
    private static final int EMAIL_VERIFICATION_EXPIRES_MINUTES = 10;
    private static final int PASSWORD_RESET_OTP_EXPIRES_MINUTES = 5;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final JwtService jwtService;
    private final JwtBlacklistService jwtBlacklistService;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final TenantInviteRepository tenantInviteRepository;
    private final TenantRepository tenantRepository;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TokenResponse login(LoginRequest request) {
        try {
            String identifier = request.getUsername() == null ? "" : request.getUsername().trim();
            UserEntity user = userRepository.findByUsernameOrEmailWithRoles(identifier)
                    .orElseThrow(() -> new BadCredentialsException(INVALID_CREDENTIALS_MESSAGE));

            if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                throw new BadCredentialsException(INVALID_CREDENTIALS_MESSAGE);
            }

            if (user.getStatus() == UserStatus.DISABLED) {
                throw new DisabledException(LOCKED_ACCOUNT_MESSAGE);
            }

            if (!Boolean.TRUE.equals(user.getIsEmailVerified())) {
                throw new DisabledException(UNVERIFIED_ACCOUNT_MESSAGE);
            }

            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(identifier, request.getPassword())
            );

            log.info("Đăng nhập thành công cho tài khoản {}", identifier);
            SecurityContextHolder.getContext().setAuthentication(authentication);

            if (!(authentication.getPrincipal() instanceof UserEntity authenticatedUser)) {
                throw new UsernameNotFoundException("Không tìm thấy người dùng");
            }

            authenticatedUser.setLoginProvider(LoginProvider.LOCAL);
            authenticatedUser.setLastLogin(LocalDateTime.now());
            userRepository.save(authenticatedUser);

            List<String> authorities = authentication.getAuthorities()
                    .stream()
                    .map(a -> a.getAuthority())
                    .toList();

            UUID userId = authenticatedUser.getId();
            UUID tenantId = authenticatedUser.getTenant() != null ? authenticatedUser.getTenant().getId() : null;
            String accessToken = jwtService.generateAccessToken(userId, tenantId, authenticatedUser.getEmail(), authorities);
            String refreshToken = jwtService.generateRefreshToken(userId, tenantId, authenticatedUser.getEmail(), authorities);

            return TokenResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .build();

        } catch (BadCredentialsException e) {
            log.warn("Sai mật khẩu cho người dùng: {}", request.getUsername());
            throw new BadCredentialsException(INVALID_CREDENTIALS_MESSAGE);

        } catch (InternalAuthenticationServiceException e) {
            log.warn("Người dùng không tồn tại: {}", request.getUsername());

            if (e.getCause() instanceof UsernameNotFoundException) {
                throw new BadCredentialsException(INVALID_CREDENTIALS_MESSAGE);
            }

            throw new RuntimeException("Lỗi hệ thống khi xác thực", e);
        } catch (DisabledException e) {
            throw new DisabledException(LOCKED_ACCOUNT_MESSAGE);
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

            if (user.getStatus() == UserStatus.DISABLED) {
                throw new DisabledException(LOCKED_ACCOUNT_MESSAGE);
            }

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
        } catch (DisabledException exception) {
            throw exception;
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
        String emailVerificationToken = generateVerificationOtp();

        UserEntity user = UserEntity.builder()
                .fullName(request.getFullName())
                .username(generatedUsername)
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .status(UserStatus.ACTIVE)
                .roles(Set.of(role))
                .tenant(tenant)
                .isEmailVerified(false)
                .emailVerificationToken(emailVerificationToken)
                .emailVerificationExpiresAt(LocalDateTime.now().plusMinutes(EMAIL_VERIFICATION_EXPIRES_MINUTES))
                .build();
        userRepository.save(user);

        emailService.sendVerificationEmail(
                user.getEmail(),
                "Xác thực email",
                user.getFullName(),
                emailVerificationToken
        );
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

    private String generateVerificationOtp() {
        int maxValue = (int) Math.pow(10, EMAIL_VERIFICATION_OTP_LENGTH);
        int otp = SECURE_RANDOM.nextInt(maxValue);
        return String.format("%0" + EMAIL_VERIFICATION_OTP_LENGTH + "d", otp);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ApiResponse verifyEmail(VerifyEmailRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new InvalidDataException("Thiếu email xác minh");
        }
        if (request.getOtp() == null || request.getOtp().isBlank()) {
            throw new InvalidDataException("Thiếu OTP xác minh");
        }
        UserEntity user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new InvalidDataException("Không tìm thấy tài khoản"));
        if (Boolean.TRUE.equals(user.getIsEmailVerified())) {
            return ApiResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("Tài khoản đã được xác minh")
                    .build();
        }
        if (user.getEmailVerificationToken() == null || !user.getEmailVerificationToken().equals(request.getOtp())) {
            throw new InvalidDataException("OTP xác minh không hợp lệ");
        }
        if (user.getEmailVerificationExpiresAt() != null && user.getEmailVerificationExpiresAt().isBefore(LocalDateTime.now())) {
            throw new InvalidDataException("OTP xác minh đã hết hạn");
        }
        user.setIsEmailVerified(true);
        user.setEmailVerificationToken(null);
        user.setEmailVerificationExpiresAt(null);
        userRepository.save(user);
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Xác minh email thành công")
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ApiResponse resendVerificationEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new InvalidDataException("Thiếu email");
        }
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new InvalidDataException("Không tìm thấy tài khoản"));
        if (Boolean.TRUE.equals(user.getIsEmailVerified())) {
            return ApiResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("Tài khoản đã được xác minh từ trước")
                    .build();
        }
        String newOtp = generateVerificationOtp();
        user.setEmailVerificationToken(newOtp);
        user.setEmailVerificationExpiresAt(LocalDateTime.now().plusMinutes(EMAIL_VERIFICATION_EXPIRES_MINUTES));
        userRepository.save(user);
        emailService.sendVerificationEmail(user.getEmail(), "Xác thực email", user.getFullName(), newOtp);
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Đã gửi lại OTP. Vui lòng kiểm tra email")
                .build();
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

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ApiResponse sendResetPasswordOtp(ForgotPasswordRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new InvalidDataException("Thiếu email");
        }
        UserEntity user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new InvalidDataException("Không tìm thấy tài khoản với email này"));
        if (user.getStatus() == UserStatus.DISABLED) {
            throw new InvalidDataException("Tài khoản đã bị khóa");
        }
        String resetOtp = generateVerificationOtp();
        user.setPasswordResetToken(resetOtp);
        user.setPasswordResetExpiresAt(LocalDateTime.now().plusMinutes(PASSWORD_RESET_OTP_EXPIRES_MINUTES));
        userRepository.save(user);
        emailService.sendResetPasswordEmail(user.getEmail(), "Đặt lại mật khẩu", user.getFullName(), resetOtp);
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Đã gửi mã OTP đặt lại mật khẩu. Vui lòng kiểm tra email")
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse verifyResetPasswordOtp(ForgotPasswordRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new InvalidDataException("Thiếu email");
        }
        if (request.getOtp() == null || request.getOtp().isBlank()) {
            throw new InvalidDataException("Thiếu OTP");
        }

        UserEntity user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new InvalidDataException("Không tìm thấy tài khoản"));
        if (user.getPasswordResetToken() == null || !user.getPasswordResetToken().equals(request.getOtp())) {
            throw new InvalidDataException("OTP không hợp lệ");
        }
        if (user.getPasswordResetExpiresAt() != null && user.getPasswordResetExpiresAt().isBefore(LocalDateTime.now())) {
            throw new InvalidDataException("OTP đã hết hạn");
        }

        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("OTP hợp lệ")
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ApiResponse resetPassword(ForgotPasswordRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new InvalidDataException("Thiếu email");
        }
        if (request.getOtp() == null || request.getOtp().isBlank()) {
            throw new InvalidDataException("Thiếu OTP");
        }
        if (request.getNewPassword() == null || request.getNewPassword().isBlank()) {
            throw new InvalidDataException("Thiếu mật khẩu mới");
        }
        if (!request.getNewPassword().equals(request.getConfirmNewPassword())) {
            throw new InvalidDataException("Mật khẩu và xác nhận mật khẩu không khớp");
        }
        UserEntity user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new InvalidDataException("Không tìm thấy tài khoản"));
        if (user.getPasswordResetToken() == null || !user.getPasswordResetToken().equals(request.getOtp())) {
            throw new InvalidDataException("OTP không hợp lệ");
        }
        if (user.getPasswordResetExpiresAt() != null && user.getPasswordResetExpiresAt().isBefore(LocalDateTime.now())) {
            throw new InvalidDataException("OTP đã hết hạn");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordResetToken(null);
        user.setPasswordResetExpiresAt(null);
        userRepository.save(user);
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Đặt lại mật khẩu thành công")
                .build();
    }
}
