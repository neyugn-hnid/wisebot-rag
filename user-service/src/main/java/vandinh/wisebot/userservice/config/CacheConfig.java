package vandinh.wisebot.userservice.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.cache.support.NoOpCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
@EnableConfigurationProperties(AppFeatureProperties.class)
public class CacheConfig {

    @Bean
    public CacheManager cacheManager(AppFeatureProperties properties) {
        if (!properties.getCache().isEnabled()) {
            return new NoOpCacheManager();
        }

        return new ConcurrentMapCacheManager("user-by-id");
    }
}