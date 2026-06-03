package vandinh.wisebot.documentservice.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "embedding")
public class EmbeddingProperties {
    private String baseUrl = "http://localhost:8001";
    private String path = "/embed";
}
