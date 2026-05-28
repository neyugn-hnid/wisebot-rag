package vandinh.wisebot.chatservice.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "widget")
public class WidgetProperties {
    private String baseUrl = "http://localhost:8084";
}
