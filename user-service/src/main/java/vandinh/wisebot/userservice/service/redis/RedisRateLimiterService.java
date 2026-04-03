package vandinh.wisebot.userservice.service.redis;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import vandinh.wisebot.userservice.config.RedisFeatureProperties;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class RedisRateLimiterService implements RateLimiterService {

    private final StringRedisTemplate stringRedisTemplate;
    private final RedisFeatureProperties properties;

    @Override
    public boolean isAllowed(String clientKey) {
        if (!properties.getRateLimit().isEnabled()) {
            return true;
        }

        String key = properties.getRateLimit().getPrefix() + clientKey;
        Long count = stringRedisTemplate.opsForValue().increment(key);

        if (count != null && count == 1L) {
            stringRedisTemplate.expire(key, properties.getRateLimit().getWindowSeconds(), TimeUnit.SECONDS);
        }

        return count != null && count <= properties.getRateLimit().getLimit();
    }
}
