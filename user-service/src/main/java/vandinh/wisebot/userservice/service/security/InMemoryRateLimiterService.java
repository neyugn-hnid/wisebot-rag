package vandinh.wisebot.userservice.service.security;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import vandinh.wisebot.userservice.config.AppFeatureProperties;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class InMemoryRateLimiterService implements RateLimiterService {

    private final AppFeatureProperties properties;
    private final Map<String, CounterWindow> counters = new ConcurrentHashMap<>();

    @Override
    public boolean isAllowed(String clientKey) {
        if (!properties.getRateLimit().isEnabled()) {
            return true;
        }

        long nowEpochSecond = Instant.now().getEpochSecond();
        int windowSeconds = Math.max(properties.getRateLimit().getWindowSeconds(), 1);
        int limit = Math.max(properties.getRateLimit().getLimit(), 1);
        String key = properties.getRateLimit().getPrefix() + clientKey;

        CounterWindow window = counters.compute(key, (k, current) -> {
            if (current == null || nowEpochSecond - current.windowStartEpochSecond >= windowSeconds) {
                return new CounterWindow(nowEpochSecond, 1);
            }
            current.counter++;
            return current;
        });

        return window != null && window.counter <= limit;
    }

    private static final class CounterWindow {
        private final long windowStartEpochSecond;
        private int counter;

        private CounterWindow(long windowStartEpochSecond, int counter) {
            this.windowStartEpochSecond = windowStartEpochSecond;
            this.counter = counter;
        }
    }
}