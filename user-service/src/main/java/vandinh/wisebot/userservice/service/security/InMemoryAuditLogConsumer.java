package vandinh.wisebot.userservice.service.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vandinh.wisebot.userservice.config.AppFeatureProperties;
import vandinh.wisebot.userservice.entity.AuditLog;
import vandinh.wisebot.userservice.repository.AuditLogRepository;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j(topic = "AUDIT_LOG_CONSUMER")
public class InMemoryAuditLogConsumer {

    private final InMemoryAuditBuffer auditBuffer;
    private final AppFeatureProperties properties;
    private final AuditLogRepository auditLogRepository;

    @Scheduled(fixedDelayString = "${app.features.audit.poll-interval-ms:1000}")
    @Transactional
    public void drainQueue() {
        if (!properties.getAudit().isEnabled() || !properties.getAudit().isDbEnabled()) {
            return;
        }

        int batchSize = properties.getAudit().getBatchSize();
        if (batchSize <= 0) {
            return;
        }

        List<AuditLogEntry> entries = auditBuffer.pollBatch(batchSize);
        if (entries.isEmpty()) {
            return;
        }

        List<AuditLog> batch = entries.stream()
                .map(this::map)
                .toList();

        if (!batch.isEmpty()) {
            auditLogRepository.saveAll(batch);
        }
    }

    private AuditLog map(AuditLogEntry entry) {
        UUID userId = null;
        if (entry.getUserId() != null && !entry.getUserId().isBlank() && !"anonymous".equals(entry.getUserId())) {
            try {
                userId = UUID.fromString(entry.getUserId());
            } catch (IllegalArgumentException ignored) {
                log.debug("Invalid audit user id: {}", entry.getUserId());
            }
        }

        LocalDateTime createdAt = null;
        if (entry.getTimestamp() != null && !entry.getTimestamp().isBlank()) {
            try {
                createdAt = LocalDateTime.ofInstant(Instant.parse(entry.getTimestamp()), ZoneId.systemDefault());
            } catch (Exception ignored) {
                log.debug("Invalid audit timestamp: {}", entry.getTimestamp());
            }
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }

        return AuditLog.builder()
                .userId(userId)
                .action(entry.getAction())
                .resource(entry.getResource())
                .method(entry.getMethod())
                .endpoint(entry.getEndpoint())
                .ipAddress(entry.getIpAddress())
                .userAgent(entry.getUserAgent())
                .statusCode(entry.getStatus())
                .createdAt(createdAt)
                .build();
    }
}