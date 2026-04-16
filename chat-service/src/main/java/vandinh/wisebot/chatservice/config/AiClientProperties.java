package vandinh.wisebot.chatservice.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "integration.ai")
public class AiClientProperties {
    private String baseUrl;
    private String askPath;
    private String streamPath;
    private String serviceToken;
}
