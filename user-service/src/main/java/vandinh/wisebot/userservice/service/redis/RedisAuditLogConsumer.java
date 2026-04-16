package vandinh.wisebot.userservice.service.redis;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.redis.core.StringRedisTemplate;
import vandinh.wisebot.userservice.config.RedisFeatureProperties;
import vandinh.wisebot.userservice.entity.AuditLog;
import vandinh.wisebot.userservice.repository.AuditLogRepository;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j(topic = "AUDIT_LOG_CONSUMER")
public class RedisAuditLogConsumer {

    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;
    private final RedisFeatureProperties properties;
    private final AuditLogRepository auditLogRepository;

    @Scheduled(fixedDelayString = "${app.redis.audit.poll-interval-ms:1000}")
    @Transactional
    public void drainQueue() {
        if (!properties.getAudit().isEnabled() || !properties.getAudit().isDbEnabled()) {
            return;
        }

        int batchSize = properties.getAudit().getBatchSize();
        if (batchSize <= 0) {
            return;
        }

        List<AuditLog> batch = new ArrayList<>(batchSize);
        String listKey = properties.getAudit().getListKey();

        for (int i = 0; i < batchSize; i++) {
            String payload = stringRedisTemplate.opsForList().rightPop(listKey);
            if (payload == null) {
                break;
            }

            try {
                AuditLogEntry entry = objectMapper.readValue(payload, AuditLogEntry.class);
                batch.add(map(entry));
            } catch (Exception e) {
                log.warn("Failed to parse audit log entry", e);
            }
        }

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
            }
        }

        LocalDateTime createdAt = null;
        if (entry.getTimestamp() != null && !entry.getTimestamp().isBlank()) {
            try {
                createdAt = LocalDateTime.ofInstant(Instant.parse(entry.getTimestamp()), ZoneId.systemDefault());
            } catch (Exception ignored) {
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
