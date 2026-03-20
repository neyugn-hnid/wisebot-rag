package vandinh.wisebot.userservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vandinh.wisebot.userservice.entity.UserEntity;

import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Long> {
    @Query("SELECT DISTINCT u FROM UserEntity u LEFT JOIN FETCH u.roles WHERE u.username = :username")
    Optional<UserEntity> findByUsernameWithRoles(@Param("username") String username);

    @Query("SELECT u FROM UserEntity u LEFT JOIN FETCH u.roles WHERE u.username = :username")
    Optional<UserEntity> findByUsername(@Param("username") String username);
    
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
}
