package vandinh.wisebot.userservice.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vandinh.wisebot.userservice.dto.response.UserResponse;
import vandinh.wisebot.userservice.entity.UserEntity;
import vandinh.wisebot.userservice.exception.ResourceNotFoundException;
import vandinh.wisebot.userservice.mapper.UserMapper;
import vandinh.wisebot.userservice.repository.UserRepository;
import vandinh.wisebot.userservice.service.UserService;


@Service
@RequiredArgsConstructor
@Slf4j(topic = "USER-SERVICE")
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;
    private final UserMapper userMapper;


    @Transactional
    @Override
    public UserResponse getUserByUsername(String username) {
        UserEntity userEntity = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found with usrename: " + username));
        return userMapper.toUserResponse(userEntity);
    }

    @Transactional
    @Override
    public UserResponse getProfile(String email) {
        return getUserByUsername(email);
    }

    private UserEntity getUserEntity(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }
}
