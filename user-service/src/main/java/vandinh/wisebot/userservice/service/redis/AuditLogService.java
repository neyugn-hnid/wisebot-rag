package vandinh.wisebot.userservice.service.redis;

public interface AuditLogService {
    void enqueue(AuditLogEntry entry);
}
