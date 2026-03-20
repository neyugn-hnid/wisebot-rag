package vandinh.wisebot.userservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vandinh.wisebot.userservice.entity.UserEntity;
import vandinh.wisebot.userservice.repository.UserRepository;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j(topic = "USER-DETAIL-SERVICE")
public class UserServiceDetail implements UserDetailsService {
    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Optional<UserEntity> user = userRepository.findByUsername(username);

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
}
