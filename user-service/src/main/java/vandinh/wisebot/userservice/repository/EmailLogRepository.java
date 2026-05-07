package vandinh.wisebot.userservice.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vandinh.wisebot.userservice.entity.EmailLog;


@Repository
public interface EmailLogRepository extends JpaRepository<EmailLog, UUID> {
}
