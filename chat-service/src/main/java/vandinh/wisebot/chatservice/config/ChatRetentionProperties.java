package vandinh.wisebot.chatservice.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "chat.retention")
public class ChatRetentionProperties {
    private boolean cleanupEnabled = true;
    private int widgetSessionDays = 90;
    private int batchSize = 500;
}
