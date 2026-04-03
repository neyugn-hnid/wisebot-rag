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
import vandinh.wisebot.userservice.common.enums.UserStatus;
import vandinh.wisebot.userservice.common.response.TokenResponse;
import vandinh.wisebot.userservice.dto.request.LoginRequest;
import vandinh.wisebot.userservice.dto.request.RegisterRequest;
import vandinh.wisebot.userservice.entity.Role;
import vandinh.wisebot.userservice.entity.Tenant;
import vandinh.wisebot.userservice.entity.UserEntity;
import vandinh.wisebot.userservice.exception.InvalidDataException;
import vandinh.wisebot.userservice.repository.RoleRepository;
import vandinh.wisebot.userservice.repository.TenantRepository;
import vandinh.wisebot.userservice.repository.UserRepository;
import vandinh.wisebot.userservice.service.AuthService;
import vandinh.wisebot.userservice.service.JwtService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j(topic = "AUTH-SERVICE")
public class AuthServiceImpl implements AuthService {
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
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
        if (userRepository.existsByUsername(request.getUsername())){
            throw new InvalidDataException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())){
            throw new InvalidDataException("Email already exists");
        }

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new InvalidDataException("Password and Confirm Password do not match");
        }

        Role role = roleRepository.findByName(RoleName.USER)
                .orElseThrow(() -> new RuntimeException("Role not found"));

        Tenant tenant = tenantRepository.findFirstByOrderByCreatedAtAsc()
            .orElseThrow(() -> new RuntimeException("Tenant not found"));

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
}
