package vandinh.wisebot.userservice.service.security;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import vandinh.wisebot.userservice.config.AppFeatureProperties;

@Service
@RequiredArgsConstructor
public class InMemoryAuditLogService implements AuditLogService {

    private final InMemoryAuditBuffer auditBuffer;
    private final AppFeatureProperties properties;

    @Override
    public void enqueue(AuditLogEntry entry) {
        if (!properties.getAudit().isEnabled()) {
            return;
        }

        auditBuffer.enqueue(entry, properties.getAudit().getMaxLength());
    }
}