package vandinh.wisebot.userservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vandinh.wisebot.userservice.entity.EmailLog;

import java.util.UUID;

public interface EmailLogRepository extends JpaRepository<EmailLog, UUID> {
}
