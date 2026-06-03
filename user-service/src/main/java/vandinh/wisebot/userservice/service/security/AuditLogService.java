package vandinh.wisebot.userservice.service.security;

public interface AuditLogService {
    void enqueue(AuditLogEntry entry);
}