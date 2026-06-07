package vandinh.wisebot.documentservice.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "markitdown")
public class MarkitdownProperties {
    private boolean enabled = false;
    private String baseUrl = "http://localhost:8006";
    private String parsePath = "/parse";
}
