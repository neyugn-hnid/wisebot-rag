package vandinh.wisebot.userservice.repository;

import org.springframework.boot.autoconfigure.security.SecurityProperties.User;
import org.springframework.data.jpa.repository.JpaRepository;
import vandinh.wisebot.userservice.entity.UserEntity;

public interface UserRepository extends JpaRepository<UserEntity, Long> {
}
