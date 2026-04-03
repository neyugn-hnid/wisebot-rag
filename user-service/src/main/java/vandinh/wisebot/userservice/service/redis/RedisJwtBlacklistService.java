package vandinh.wisebot.userservice.service.redis;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import vandinh.wisebot.userservice.config.RedisFeatureProperties;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class RedisJwtBlacklistService implements JwtBlacklistService {

    private final StringRedisTemplate stringRedisTemplate;
    private final RedisFeatureProperties properties;

    @Override
    public void blacklist(String token, Date expiry) {
        if (!properties.getJwtBlacklist().isEnabled()) {
            return;
        }

        long ttlSeconds = Duration.between(Instant.now(), expiry.toInstant()).getSeconds();
        if (ttlSeconds <= 0) {
            return;
        }

        String key = buildKey(token);
        stringRedisTemplate.opsForValue().set(key, "1", ttlSeconds, TimeUnit.SECONDS);
    }

    @Override
    public boolean isBlacklisted(String token) {
        if (!properties.getJwtBlacklist().isEnabled()) {
            return false;
        }

        String key = buildKey(token);
        return Boolean.TRUE.equals(stringRedisTemplate.hasKey(key));
    }

    private String buildKey(String token) {
        return properties.getJwtBlacklist().getPrefix() + hashToken(token);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (Exception e) {
            return token;
        }
    }
}
