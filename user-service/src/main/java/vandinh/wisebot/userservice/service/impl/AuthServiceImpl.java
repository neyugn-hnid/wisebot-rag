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
import vandinh.wisebot.userservice.service.redis.JwtBlacklistService;
import org.springframework.http.HttpStatus;

import java.util.Date;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.List;
import java.util.Set;
import java.util.UUID;

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

            UserEntity user = userRepository.findByUsername(authentication.getName())
                    .orElseThrow(() -> new UsernameNotFoundException("User not found"));
            user.setLoginProvider(LoginProvider.LOCAL);
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);

            List<String> authorities = authentication.getAuthorities()
                    .stream()
                    .map(a -> a.getAuthority())
                    .toList();

            UUID userId = user.getId();
            String accessToken = jwtService.generateAccessToken(userId, user.getEmail(), authorities);
            String refreshToken = jwtService.generateRefreshToken(userId, user.getEmail(), authorities);

            return TokenResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .build();

        } catch (BadCredentialsException e) {
            log.warn("Password incorrect for user: {}", request.getUsername());
            throw new BadCredentialsException("Wrong account or password");

        } catch (InternalAuthenticationServiceException e) {
            log.warn("User does not exist: {}", request.getUsername());

            if (e.getCause() instanceof UsernameNotFoundException) {
                throw new BadCredentialsException("Wrong account or password");
            }

            throw new RuntimeException("System error during authentication", e);
        } catch (DisabledException e) {
            throw new DisabledException("Account is disabled");
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new InvalidDataException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new InvalidDataException("Email already exists");
        }

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new InvalidDataException("Password and Confirm Password do not match");
        }

        Role role = roleRepository.findByName(RoleName.USER)
                .orElseThrow(() -> new RuntimeException("Role not found"));

        Tenant tenant;
        if (request.getInviteToken() != null && !request.getInviteToken().isBlank()) {
            TenantInvite invite = tenantInviteRepository
                    .findByTokenAndStatus(request.getInviteToken(), InviteStatus.PENDING)
                    .orElseThrow(() -> new InvalidDataException("Invite is invalid"));

            if (invite.getExpiresAt() != null && invite.getExpiresAt().isBefore(LocalDateTime.now())) {
                invite.setStatus(InviteStatus.EXPIRED);
                tenantInviteRepository.save(invite);
                throw new InvalidDataException("Invite has expired");
            }

            if (invite.getEmail() != null && !invite.getEmail().equalsIgnoreCase(request.getEmail())) {
                throw new InvalidDataException("Invite email does not match");
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


        UserEntity user = UserEntity.builder()
                .fullName(request.getFullName())
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .status(UserStatus.ACTIVE)
                .roles(Set.of(role))
                .tenant(tenant)
                .isEmailVerified(false)
                .build();
        userRepository.save(user);
    }

    @Override
    public ApiResponse logout(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            return ApiResponse.builder()
                    .status(HttpStatus.BAD_REQUEST.value())
                    .message("Missing Authorization header")
                    .build();
        }

        String token = authorizationHeader.substring(7);
        try {
            Date expiry = jwtService.extractExpiration(token, vandinh.wisebot.userservice.common.enums.TokenType.ACCESS_TOKEN);
            jwtBlacklistService.blacklist(token, expiry);
        } catch (Exception ex) {
            return ApiResponse.builder()
                    .status(HttpStatus.UNAUTHORIZED.value())
                    .message("Invalid or expired token")
                    .build();
        }

        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Logged out successfully")
                .build();
    }

    @Override
    public ApiResponse inviteUser(UUID tenantId, String email) {
        if (tenantId == null) {
            throw new InvalidDataException("Tenant is required");
        }
        if (email == null || email.isBlank()) {
            throw new InvalidDataException("Email is required");
        }

        if (userRepository.existsByEmail(email)) {
            throw new InvalidDataException("Email already exists");
        }

        if (tenantInviteRepository.existsByTenant_IdAndEmailAndStatus(tenantId, email, InviteStatus.PENDING)) {
            throw new InvalidDataException("Invite already sent");
        }

        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new InvalidDataException("Tenant not found"));

        TenantInvite invite = new TenantInvite();
        invite.setTenant(tenant);
        invite.setEmail(email);
        invite.setToken(UUID.randomUUID().toString());
        invite.setStatus(InviteStatus.PENDING);
        invite.setExpiresAt(LocalDateTime.now().plusDays(7));
        tenantInviteRepository.save(invite);

        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Invite created")
                .data(Map.of(
                        "token", invite.getToken(),
                        "expiresAt", invite.getExpiresAt()
                ))
                .build();
    }
}
