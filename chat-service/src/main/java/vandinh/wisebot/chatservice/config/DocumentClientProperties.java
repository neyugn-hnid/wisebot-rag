package vandinh.wisebot.chatservice.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "integration.document")
public class DocumentClientProperties {
    private String baseUrl;
    private String knowledgeBasesPath;
}
