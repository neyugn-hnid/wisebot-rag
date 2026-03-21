package vandinh.wisebot.userservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vandinh.wisebot.userservice.entity.UserEntity;
import vandinh.wisebot.userservice.repository.UserRepository;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j(topic = "USER-DETAIL-SERVICE")
public class UserServiceDetail implements UserDetailsService {
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Optional<UserEntity> user = userRepository.findByUsernameWithRoles(username);

        if (user.isEmpty()) {
            user = userRepository.findByUsername(username);
        }

        UserEntity userEntity = user.orElseThrow(() -> {
            log.error("User not found in the database: {}", username);
            return new UsernameNotFoundException("User not found");
        });

        log.info("User found in the database: {}", username);
        return userEntity;
    }

    @Transactional(readOnly = true)
    public UserDetails loadUserById(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.error("User not found with id: {}", userId);
                    return new UsernameNotFoundException("User not found");
                });

        log.info("User found with id: {}", userId);
        return user;
    }
}
