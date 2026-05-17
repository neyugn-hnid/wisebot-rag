package vandinh.wisebot.chatservice.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "integration.embedding")
public class EmbeddingClientProperties {
    private String baseUrl;
    private String searchPath;
    private String providerPath;
    private String serviceToken;
}
