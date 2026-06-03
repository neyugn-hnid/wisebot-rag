package vandinh.wisebot.userservice.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.features")
public class AppFeatureProperties {
    private JwtBlacklist jwtBlacklist = new JwtBlacklist();
    private RateLimit rateLimit = new RateLimit();
    private Audit audit = new Audit();
    private Cache cache = new Cache();

    @Getter
    @Setter
    public static class JwtBlacklist {
        private boolean enabled = true;
        private String prefix = "jwt:bl:";
    }

    @Getter
    @Setter
    public static class RateLimit {
        private boolean enabled = true;
        private int limit = 100;
        private int windowSeconds = 60;
        private String prefix = "rate:ip:";
    }

    @Getter
    @Setter
    public static class Audit {
        private boolean enabled = false;
        private boolean dbEnabled = false;
        private int maxLength = 10000;
        private int batchSize = 200;
        private long pollIntervalMs = 1000;
    }

    @Getter
    @Setter
    public static class Cache {
        private boolean enabled = true;
        private Duration defaultTtl = Duration.ofMinutes(10);
        private Map<String, Duration> ttlByCache = new HashMap<>();
    }
}