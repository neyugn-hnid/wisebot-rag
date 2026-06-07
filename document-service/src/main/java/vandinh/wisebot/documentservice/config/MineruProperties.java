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
    private String fileParsePath = "/file_parse";
    private String backend = "pipeline";
    private String parseMethod = "txt";
    private String lang = "latin";
    private int connectionTimeoutMs = 30000;
    private int readTimeoutMs = 900000;
}
