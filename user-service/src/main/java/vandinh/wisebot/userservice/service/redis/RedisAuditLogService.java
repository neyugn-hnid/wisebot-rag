package vandinh.wisebot.userservice.service.redis;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import vandinh.wisebot.userservice.config.RedisFeatureProperties;

@Service
@RequiredArgsConstructor
public class RedisAuditLogService implements AuditLogService {

    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;
    private final RedisFeatureProperties properties;

    @Override
    public void enqueue(AuditLogEntry entry) {
        if (!properties.getAudit().isEnabled()) {
            return;
        }

        int maxLength = properties.getAudit().getMaxLength();
        if (maxLength <= 0) {
            return;
        }

        try {
            String payload = objectMapper.writeValueAsString(entry);
            String key = properties.getAudit().getListKey();
            stringRedisTemplate.opsForList().leftPush(key, payload);
            stringRedisTemplate.opsForList().trim(key, 0, maxLength - 1);
        } catch (Exception ignored) {
            // Avoid breaking request flow for audit queue errors.
        }
    }
}
