package vandinh.wisebot.userservice.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import vandinh.wisebot.userservice.common.response.TokenResponse;
import vandinh.wisebot.userservice.dto.request.SignInRequest;
import vandinh.wisebot.userservice.repository.RoleRepository;
import vandinh.wisebot.userservice.repository.UserRepository;
import vandinh.wisebot.userservice.service.AuthService;
import vandinh.wisebot.userservice.service.JwtService;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j(topic = "AUTH-SERVICE")
public class AuthServiceImpl implements AuthService {
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;

    @Override
    public TokenResponse login(SignInRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );

            log.info("Login success for account {}", request.getUsername());
            SecurityContextHolder.getContext().setAuthentication(authentication);

            List<String> authorities = authentication.getAuthorities()
                    .stream()
                    .map(a -> a.getAuthority())
                    .toList();

            String accessToken = jwtService.generateAccessToken(authentication.getName(), authorities);
            String refreshToken = jwtService.generateRefreshToken(authentication.getName(), authorities);

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
            throw new DisabledException("Tài khoản bị vô hiệu hóa");
        }
    }
}
