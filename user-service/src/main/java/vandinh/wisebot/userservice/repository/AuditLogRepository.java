package vandinh.wisebot.userservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vandinh.wisebot.userservice.entity.AuditLog;

import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
}
