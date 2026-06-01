package vandinh.wisebot.documentservice.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "mineru")
public class MineruProperties {
    private boolean enabled = false;
    private String baseUrl = "http://localhost:8000";
    private String uploadPath = "/mineru/v1/upload";
    private String taskPath = "/mineru/v1/tasks";
    private long pollIntervalMs = 2000;
    private long maxPollTimeMs = 120000;
    private int connectionTimeoutMs = 30000;
    private int readTimeoutMs = 120000;
}
