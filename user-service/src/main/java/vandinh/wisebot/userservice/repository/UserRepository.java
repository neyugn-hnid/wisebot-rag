package vandinh.wisebot.userservice.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vandinh.wisebot.userservice.entity.UserEntity;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<UserEntity, UUID> {
    @Query("SELECT u FROM UserEntity u " +
            "WHERE lower(u.fullName) LIKE lower(concat('%', :keyword, '%')) " +
            "OR lower(u.username) LIKE lower(concat('%', :keyword, '%')) " +
            "OR lower(u.phone) LIKE lower(concat('%', :keyword, '%')) " +
            "OR lower(u.email) LIKE lower(concat('%', :keyword, '%'))")
    Page<UserEntity> searchByKeyword(String keyword, Pageable pageable);

    @Query("SELECT DISTINCT u FROM UserEntity u LEFT JOIN FETCH u.roles WHERE u.username = :username")
    Optional<UserEntity> findByUsernameWithRoles(@Param("username") String username);

    @Query("SELECT DISTINCT u FROM UserEntity u LEFT JOIN FETCH u.roles WHERE lower(u.email) = lower(:email)")
    Optional<UserEntity> findByEmailWithRoles(@Param("email") String email);

    @Query("SELECT DISTINCT u FROM UserEntity u LEFT JOIN FETCH u.roles WHERE lower(u.username) = lower(:identifier) OR lower(u.email) = lower(:identifier)")
    Optional<UserEntity> findByUsernameOrEmailWithRoles(@Param("identifier") String identifier);

    @Query("SELECT u FROM UserEntity u LEFT JOIN FETCH u.roles WHERE u.username = :username")
    Optional<UserEntity> findByUsername(@Param("username") String username);

    @Query("SELECT u FROM UserEntity u LEFT JOIN FETCH u.roles WHERE lower(u.email) = lower(:email)")
    Optional<UserEntity> findByEmail(@Param("email") String email);

    @Query("SELECT u FROM UserEntity u LEFT JOIN FETCH u.roles WHERE lower(u.username) = lower(:identifier) OR lower(u.email) = lower(:identifier)")
    Optional<UserEntity> findByUsernameOrEmail(@Param("identifier") String identifier);

    @Query("SELECT u FROM UserEntity u LEFT JOIN FETCH u.roles WHERE u.id = :id")
    Optional<UserEntity> findById(@Param("id") UUID id);
    
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
}
